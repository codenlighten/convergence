import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import Bull from 'bull';
import { converge } from '../index.js';
import { provisionTenant, getTenantStatus, destroyTenant, listTenants, getTenantLogs } from './tenant-service.js';

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEYS = (process.env.API_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
const USE_QUEUE = Boolean(process.env.REDIS_URL);
const tasks = new Map(); // In-memory task tracker for async jobs
let convergeQueue = null;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

// Rate limiting per API key (or IP if key absent)
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip
}));

// API key auth (optional: if no API_KEYS configured, allow all)
app.use((req, res, next) => {
  if (API_KEYS.length === 0) return next();
  const key = req.headers['x-api-key'];
  if (!key || !API_KEYS.includes(key)) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid API key' });
  }
  next();
});

// Validation schemas
const convergeSchema = Joi.object({
  prompt: Joi.string().min(8).required(),
  agentARole: Joi.string().optional(),
  agentBRole: Joi.string().optional(),
  maxIterations: Joi.number().integer().min(1).max(20).default(8),
  temperature: Joi.number().min(0).max(2).default(0.3),
  model: Joi.string().optional(),
  webhookUrl: Joi.string().uri().optional()
});

const webhookSchema = Joi.object({
  webhookUrl: Joi.string().uri().required()
});

// Optional Bull queue
if (USE_QUEUE) {
  convergeQueue = new Bull('converge', {
    redis: process.env.REDIS_URL,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 }
    }
  });

  convergeQueue.process(async (job) => {
    return handleConvergence(job.data);
  });

  convergeQueue.on('failed', (job, err) => {
    const taskId = job.data.taskId;
    tasks.set(taskId, { status: 'failed', error: err.message });
  });
}

// Helpers
function recordTask(taskId, status, payload = {}) {
  tasks.set(taskId, { status, updatedAt: new Date().toISOString(), ...payload });
}

async function sendWebhook(url, body) {
  const maxAttempts = 3;
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error(`Webhook responded ${resp.status}`);
      return true;
    } catch (err) {
      const delay = 1000 * Math.pow(2, attempt - 1);
      if (attempt === maxAttempts) return false;
      await new Promise(res => setTimeout(res, delay));
    }
  }
  return false;
}

async function handleConvergence(data) {
  const { taskId, prompt, agentARole, agentBRole, maxIterations, temperature, model, webhookUrl } = data;
  recordTask(taskId, 'processing');
  try {
    const result = await converge(prompt, {
      agentA: agentARole,
      agentB: agentBRole,
      maxIterations,
      temperature,
      model,
      openaiApiKey: process.env.OPENAI_API_KEY
    });

    const summary = {
      taskId,
      converged: result.converged,
      convergenceScore: result.convergenceScore,
      iterations: result.iterations,
      tokens: result.tokens,
      estimatedCost: result.estimatedCost,
      finalResponse: result.finalResponse
    };

    recordTask(taskId, 'completed', { result: summary });

    if (webhookUrl) {
      await sendWebhook(webhookUrl, summary);
    }

    return summary;
  } catch (err) {
    recordTask(taskId, 'failed', { error: err.message });
    throw err;
  }
}

// Routes
app.post('/api/v1/converge', async (req, res, next) => {
  try {
    const { value, error } = convergeSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ error: error.details.map(d => d.message).join('; ') });

    const { prompt, agentARole, agentBRole, maxIterations, temperature, model, webhookUrl } = value;
    const asyncRequested = Boolean(webhookUrl);

    if (asyncRequested) {
      const taskId = crypto.randomUUID();
      recordTask(taskId, 'queued', { webhookUrl });

      const payload = { taskId, prompt, agentARole, agentBRole, maxIterations, temperature, model, webhookUrl };

      if (convergeQueue) {
        await convergeQueue.add(payload);
      } else {
        setImmediate(() => handleConvergence(payload).catch(() => {}));
      }

      return res.status(202).json({ taskId, status: 'queued', async: true });
    }

    // Synchronous path
    const result = await converge(prompt, {
      agentA: agentARole,
      agentB: agentBRole,
      maxIterations,
      temperature,
      model,
      openaiApiKey: process.env.OPENAI_API_KEY
    });
    const taskId = crypto.randomUUID();
    recordTask(taskId, 'completed', { result });

    return res.json({ async: false, taskId, result });
  } catch (err) {
    next(err);
  }
});

app.get('/api/v1/status/:taskId', (req, res) => {
  const task = tasks.get(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  return res.json(task);
});

app.post('/api/v1/webhook', (req, res) => {
  const { value, error } = webhookSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ error: error.details.map(d => d.message).join('; ') });
  return res.json({ message: 'Webhook validated and ready to use', webhookUrl: value.webhookUrl });
});

app.get('/api/v1/usage', (req, res) => {
  let requests = 0;
  let totalCost = 0;
  let totalTokens = { prompt: 0, completion: 0, total: 0 };

  for (const task of tasks.values()) {
    if (task.result) {
      requests += 1;
      totalCost += Number(task.result.estimatedCost || 0);
      if (task.result.tokens) {
        totalTokens.prompt += task.result.tokens.prompt || 0;
        totalTokens.completion += task.result.tokens.completion || 0;
        totalTokens.total += task.result.tokens.total || 0;
      }
    }
  }

  return res.json({
    requests,
    totalCost: Number(totalCost.toFixed(6)),
    totalTokens
  });
});

// Swagger/OpenAPI setup
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Convergence API',
    version: '1.0.0',
    description: 'Dual-agent convergence API layer'
  },
  servers: [{ url: process.env.SWAGGER_SERVER || `http://localhost:${PORT}` }],
  security: [{ apiKeyAuth: [] }],
  components: {
    securitySchemes: {
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    },
    schemas: {
      ConvergeRequest: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          agentARole: { type: 'string' },
          agentBRole: { type: 'string' },
          maxIterations: { type: 'integer', minimum: 1, maximum: 20 },
          temperature: { type: 'number', minimum: 0, maximum: 2 },
          model: { type: 'string' },
          webhookUrl: { type: 'string', format: 'uri' }
        },
        required: ['prompt']
      },
      TaskStatus: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          result: { type: 'object' },
          error: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/api/v1/converge': {
      post: {
        summary: 'Run convergence (sync or async)',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ConvergeRequest' } }
          }
        },
        responses: {
          200: { description: 'Synchronous convergence result' },
          202: { description: 'Async accepted with taskId' },
          400: { description: 'Validation error' }
        }
      }
    },
    '/api/v1/status/{taskId}': {
      get: {
        summary: 'Get async convergence status',
        parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Task status', content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskStatus' } } } },
          404: { description: 'Task not found' }
        }
      }
    },
    '/api/v1/usage': {
      get: {
        summary: 'Get usage statistics',
        responses: { 200: { description: 'Usage summary' } }
      }
    },
    '/health': {
      get: {
        summary: 'Health check',
        responses: { 200: { description: 'Service is healthy' } }
      }
    }
  }
};

const swaggerSpec = swaggerJsdoc({ definition: swaggerDefinition, apis: [] });

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============ TENANT PROVISIONING ENDPOINTS ============

app.post('/api/v1/tenant/spawn', async (req, res, next) => {
  try {
    // In production, extract orgId from authenticated context
    const orgId = req.query.org_id || 1; // Default to test org for now
    const { name, language, framework, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const tenant = await provisionTenant(orgId, {
      name,
      language: language || 'node',
      framework,
      description
    });

    return res.status(201).json({
      success: true,
      tenant
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/v1/tenant/:envId/status', async (req, res, next) => {
  try {
    const { envId } = req.params;
    const status = await getTenantStatus(parseInt(envId));
    return res.json(status);
  } catch (err) {
    if (err.message === 'Environment not found') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

app.get('/api/v1/tenant/:envId/logs', async (req, res, next) => {
  try {
    const { envId } = req.params;
    const logs = await getTenantLogs(parseInt(envId));
    return res.json({ logs });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/v1/tenant/:envId', async (req, res, next) => {
  try {
    const { envId } = req.params;
    const result = await destroyTenant(parseInt(envId));
    return res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
});

app.get('/api/v1/tenant', async (req, res, next) => {
  try {
    const orgId = req.query.org_id || 1;
    const tenants = await listTenants(orgId);
    return res.json({ tenants });
  } catch (err) {
    next(err);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', queue: USE_QUEUE ? 'redis' : 'memory' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Convergence API running on port ${PORT} (queue: ${USE_QUEUE ? 'redis' : 'memory'})`);
  console.log(`📦 Tenant provisioning enabled at /api/v1/tenant/*`);
});
