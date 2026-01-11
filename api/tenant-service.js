/**
 * Tenant Provisioning Service
 * Manages Docker containers, lifecycle, and resource allocation
 */

import { getPool } from './db.js';
import { v4 as uuidv4 } from 'uuid';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TENANTS_DIR = '/var/lib/convergence-tenants';
const DOCKER_NETWORK = 'convergence-network';
const BASE_PORT = 8000;

/**
 * Generate Docker Compose for tenant
 */
function generateDockerCompose(env) {
  const port = BASE_PORT + env.id;
  const containerName = `convergence-tenant-${env.uuid}`;
  
  // Language-specific base images and setup
  const setupByLanguage = {
    node: {
      image: 'node:20-alpine',
      workdir: '/app',
      setup: `
RUN npm install -g pnpm
COPY package*.json ./
RUN pnpm install
COPY . .
EXPOSE 3000
CMD ["pnpm", "start"]
      `
    },
    python: {
      image: 'python:3.11-slim',
      workdir: '/app',
      setup: `
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0"]
      `
    },
    go: {
      image: 'golang:1.21-alpine',
      workdir: '/app',
      setup: `
COPY . .
RUN go mod download
RUN go build -o app .
EXPOSE 8080
CMD ["./app"]
      `
    }
  };

  const langConfig = setupByLanguage[env.language] || setupByLanguage.node;

  const dockerfile = `
FROM ${langConfig.image}
WORKDIR ${langConfig.workdir}

# Install convergence client
RUN apk add --no-cache curl

${langConfig.setup}

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:${env.language === 'node' ? 3000 : env.language === 'python' ? 8000 : 8080}/health || exit 1
  `;

  const dockerCompose = `
version: '3.8'

services:
  app:
    build: .
    container_name: ${containerName}
    networks:
      - convergence
    ports:
      - "${port}:${env.language === 'node' ? 3000 : env.language === 'python' ? 8000 : 8080}"
    environment:
      - NODE_ENV=production
      - CONVERGENCE_API_URL=http://convergence-api:3000
      - CONVERGENCE_ORG_ID=${env.org_id}
      - CONVERGENCE_ENV_ID=${env.id}
    cpus: '${env.cpu_limit}'
    mem_limit: ${env.memory_limit_mb}m
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${env.language === 'node' ? 3000 : env.language === 'python' ? 8000 : 8080}/health"]
      interval: 10s
      timeout: 5s
      retries: 3

networks:
  convergence:
    external: true
  `;

  return { dockerfile, dockerCompose, port };
}

/**
 * Create tenant environment and provision container
 */
export async function provisionTenant(orgId, config) {
  const pool = getPool();
  const { name, language = 'node', framework = null, description = null } = config;
  
  try {
    // Create environment record
    const envRes = await pool.query(
      `INSERT INTO tenant_environments (org_id, name, language, framework, description, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, uuid`,
      [orgId, name, language, framework, description, 'provisioning']
    );

    const env = { ...envRes.rows[0], org_id: orgId, language, cpu_limit: 0.5, memory_limit_mb: 512 };

    // Log provisioning start
    await logProvisioning(env.id, 'provision_start', 'started', `Provisioning tenant: ${name}`);

    // Generate Docker Compose
    const { dockerfile, dockerCompose, port } = generateDockerCompose(env);

    // Create storage directory
    const tenantDir = path.join(TENANTS_DIR, env.uuid);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }

    // Write Dockerfile and docker-compose.yml
    fs.writeFileSync(path.join(tenantDir, 'Dockerfile'), dockerfile);
    fs.writeFileSync(path.join(tenantDir, 'docker-compose.yml'), dockerCompose);

    // Create network if not exists
    try {
      execSync(`docker network inspect ${DOCKER_NETWORK}`, { stdio: 'ignore' });
    } catch {
      execSync(`docker network create ${DOCKER_NETWORK}`);
      await logProvisioning(env.id, 'network_created', 'success', `Docker network created: ${DOCKER_NETWORK}`);
    }

    // Build and start container
    try {
      execSync(`cd ${tenantDir} && docker-compose up -d`, { stdio: 'pipe' });
      await logProvisioning(env.id, 'container_started', 'success', 'Container started');
    } catch (err) {
      await logProvisioning(env.id, 'container_start_error', 'error', err.message);
      throw new Error(`Failed to start container: ${err.message}`);
    }

    // Get container ID
    const containerIdCmd = `docker-compose -f ${path.join(tenantDir, 'docker-compose.yml')} ps -q app`;
    const containerId = execSync(containerIdCmd).toString().trim();

    // Update environment with container info
    await pool.query(
      `UPDATE tenant_environments 
       SET container_id = $1, container_port = $2, storage_path = $3, status = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [containerId, port, tenantDir, 'running', env.id]
    );

    // Record container
    await pool.query(
      `INSERT INTO tenant_containers (env_id, container_id, status)
       VALUES ($1, $2, $3)`,
      [env.id, containerId, 'running']
    );

    await logProvisioning(env.id, 'provision_complete', 'success', `Tenant provisioned: http://localhost:${port}`);

    return {
      id: env.id,
      uuid: env.uuid,
      name,
      status: 'running',
      port,
      container_id: containerId,
      url: `http://localhost:${port}`
    };
  } catch (err) {
    await logProvisioning(null, 'provision_error', 'error', err.message);
    throw err;
  }
}

/**
 * Get tenant environment status
 */
export async function getTenantStatus(envId) {
  const pool = getPool();
  
  const envRes = await pool.query(
    `SELECT * FROM tenant_environments WHERE id = $1`,
    [envId]
  );

  if (!envRes.rows[0]) throw new Error('Environment not found');
  
  const env = envRes.rows[0];
  const containerRes = await pool.query(
    `SELECT * FROM tenant_containers WHERE env_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [envId]
  );

  const container = containerRes.rows[0];

  return {
    id: env.id,
    uuid: env.uuid,
    name: env.name,
    status: env.status,
    port: env.container_port,
    url: `http://localhost:${env.container_port}`,
    container: container ? {
      id: container.container_id,
      status: container.status,
      health: container.health_check_passed,
      cpu: container.cpu_percent,
      memory_mb: container.memory_bytes ? Math.round(container.memory_bytes / 1024 / 1024) : null,
      uptime_seconds: container.uptime_seconds
    } : null,
    created_at: env.created_at
  };
}

/**
 * Destroy tenant and cleanup
 */
export async function destroyTenant(envId) {
  const pool = getPool();

  const envRes = await pool.query(
    `SELECT * FROM tenant_environments WHERE id = $1`,
    [envId]
  );

  if (!envRes.rows[0]) throw new Error('Environment not found');
  
  const env = envRes.rows[0];

  try {
    const tenantDir = env.storage_path;
    
    // Stop and remove container
    if (tenantDir && fs.existsSync(tenantDir)) {
      execSync(`cd ${tenantDir} && docker-compose down -v 2>/dev/null || true`);
    }

    // Update status
    await pool.query(
      `UPDATE tenant_environments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      ['destroyed', envId]
    );

    // Cleanup storage
    if (tenantDir && fs.existsSync(tenantDir)) {
      fs.rmSync(tenantDir, { recursive: true, force: true });
    }

    await logProvisioning(envId, 'destroy_complete', 'success', 'Tenant destroyed');

    return { id: envId, status: 'destroyed' };
  } catch (err) {
    await logProvisioning(envId, 'destroy_error', 'error', err.message);
    throw err;
  }
}

/**
 * List tenant environments for org
 */
export async function listTenants(orgId) {
  const pool = getPool();
  const res = await pool.query(
    `SELECT id, uuid, name, language, framework, status, container_port, created_at
     FROM tenant_environments
     WHERE org_id = $1
     ORDER BY created_at DESC`,
    [orgId]
  );

  return res.rows.map(row => ({
    ...row,
    url: row.container_port ? `http://localhost:${row.container_port}` : null
  }));
}

/**
 * Log provisioning action
 */
async function logProvisioning(envId, action, status, message, details = {}) {
  const pool = getPool();
  if (envId) {
    await pool.query(
      `INSERT INTO provisioning_logs (env_id, action, status, message, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [envId, action, status, message, JSON.stringify(details)]
    );
  }
}

/**
 * Get provisioning logs for tenant
 */
export async function getTenantLogs(envId) {
  const pool = getPool();
  const res = await pool.query(
    `SELECT action, status, message, details, created_at
     FROM provisioning_logs
     WHERE env_id = $1
     ORDER BY created_at DESC
     LIMIT 100`,
    [envId]
  );

  return res.rows;
}
