/**
 * Convergence Tenant Starter - Express.js
 * Example application running inside convergence tenant container
 * Uses parent convergence API for intelligent decision-making
 */

import express from 'express';
import { ConvergenceClient } from '../api/convergence-client.js';

const app = express();
const PORT = 3000;

// Initialize convergence client
// Credentials come from environment variables set by Docker container
const convergence = new ConvergenceClient();

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'convergence-tenant-starter' });
});

// API Design endpoint
// Example: Use convergence to design an API architecture
app.post('/api/design', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    console.log(`🤔 Converging on API design: ${prompt.substring(0, 50)}...`);

    const result = await convergence.design(prompt);

    return res.json({
      design: result,
      convergenceScore: result.result?.convergenceScore || 0
    });
  } catch (err) {
    console.error('Design error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Code Review endpoint
// Example: Use convergence to review code
app.post('/api/review', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'code is required' });
    }

    console.log(`👀 Converging on code review: ${code.length} bytes`);

    const result = await convergence.review(code);

    return res.json({
      review: result,
      convergenceScore: result.result?.convergenceScore || 0
    });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Decision Making endpoint
// Example: Use convergence for high-stakes decisions
app.post('/api/decide', async (req, res) => {
  try {
    const { decision, context } = req.body;
    if (!decision) {
      return res.status(400).json({ error: 'decision is required' });
    }

    console.log(`⚖️  Converging on decision: ${decision.substring(0, 50)}...`);

    const result = await convergence.decide(decision, context || '');

    return res.json({
      decision: result,
      convergenceScore: result.result?.convergenceScore || 0,
      recommendation: result.result?.convergenceScore >= 80 ? 'proceed' : 'review'
    });
  } catch (err) {
    console.error('Decision error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Direct convergence endpoint
// Use this for custom convergence prompts
app.post('/api/converge', async (req, res) => {
  try {
    const { prompt, agentARole, agentBRole, maxIterations, temperature, async: isAsync } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    console.log(`🔄 Starting convergence...`);

    const result = await convergence.converge(prompt, {
      agentARole,
      agentBRole,
      maxIterations,
      temperature,
      async: isAsync
    });

    return res.json(result);
  } catch (err) {
    console.error('Convergence error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Convergence status endpoint
// Check on async convergence results
app.get('/api/converge/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const status = await convergence.status(taskId);
    return res.json(status);
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Convergence Tenant App running on port ${PORT}`);
  console.log(`\n📚 Available endpoints:`);
  console.log(`  POST /api/design   - Design something using convergence`);
  console.log(`  POST /api/review   - Review code using convergence`);
  console.log(`  POST /api/decide   - Make a decision using convergence`);
  console.log(`  POST /api/converge - Direct convergence with custom agents`);
  console.log(`  GET  /api/converge/:taskId - Check async convergence status`);
  console.log(`  GET  /health - Health check\n`);

  // Verify convergence connection
  convergence.health()
    .then(health => console.log(`✅ Connected to parent convergence API (${health.queue})\n`))
    .catch(err => console.warn(`⚠️  Could not connect to convergence API: ${err.message}\n`));
});
