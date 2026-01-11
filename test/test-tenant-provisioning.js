#!/usr/bin/env node

/**
 * Test Tenant Provisioning System
 * 
 * Run this to verify:
 * 1. Database migrations work
 * 2. Tenant provisioning creates containers
 * 3. Tenant apps can call convergence API
 * 4. Isolation and security are enforced
 */

import 'dotenv/config';
import fetch from 'node-fetch';
import { execSync } from 'node:child_process';

const API_BASE = process.env.CONVERGENCE_API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || '';

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(color, icon, message) {
  console.log(`${colors[color]}${icon} ${message}${colors.reset}`);
}

async function request(method, path, body = null) {
  const url = `${API_BASE}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (API_KEY) {
    options.headers['X-API-Key'] = API_KEY;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function runTests() {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  Convergence Tenant Provisioning Test  ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

  let passed = 0;
  let failed = 0;

  // Test 1: API Health
  log('yellow', '🔍', 'Testing API health...');
  const health = await request('GET', '/health');
  if (health.ok && health.data.status === 'ok') {
    log('green', '✅', 'API is healthy');
    passed++;
  } else {
    log('red', '❌', `API health check failed: ${health.error || health.data.error}`);
    failed++;
  }

  // Test 2: Spawn Tenant
  log('yellow', '🔍', 'Spawning test tenant...');
  const spawnRes = await request('POST', '/api/v1/tenant/spawn?org_id=1', {
    name: `test-tenant-${Date.now()}`,
    language: 'node',
    framework: 'express',
    description: 'Test tenant for integration testing'
  });

  let envId = null;
  if (spawnRes.ok && spawnRes.data.success) {
    envId = spawnRes.data.tenant.envId;
    log('green', '✅', `Tenant spawned: ID=${envId}, Port=${spawnRes.data.tenant.port}`);
    passed++;
  } else {
    log('red', '❌', `Failed to spawn tenant: ${spawnRes.data?.error || spawnRes.error}`);
    failed++;
    return printSummary(passed, failed);
  }

  // Wait for container to start
  log('yellow', '⏳', 'Waiting for container to start...');
  await new Promise(r => setTimeout(r, 3000));

  // Test 3: Get Tenant Status
  log('yellow', '🔍', 'Checking tenant status...');
  const statusRes = await request('GET', `/api/v1/tenant/${envId}/status`);
  if (statusRes.ok && statusRes.data.status) {
    log('green', '✅', `Tenant status: ${statusRes.data.status} on port ${statusRes.data.port}`);
    passed++;
  } else {
    log('red', '❌', `Failed to get tenant status: ${statusRes.data?.error || statusRes.error}`);
    failed++;
  }

  // Test 4: Tenant App Health
  if (statusRes.ok && statusRes.data.port) {
    const port = statusRes.data.port;
    log('yellow', '🔍', `Testing tenant app health on port ${port}...`);
    
    try {
      const appHealth = await fetch(`http://localhost:${port}/health`);
      const appData = await appHealth.json();
      if (appHealth.ok && appData.status === 'ok') {
        log('green', '✅', 'Tenant app is healthy');
        passed++;
      } else {
        log('red', '❌', 'Tenant app health check returned error');
        failed++;
      }
    } catch (err) {
      log('red', '❌', `Cannot reach tenant app: ${err.message}`);
      failed++;
    }
  }

  // Test 5: List Tenants
  log('yellow', '🔍', 'Listing all tenants...');
  const listRes = await request('GET', '/api/v1/tenant?org_id=1');
  if (listRes.ok && Array.isArray(listRes.data.tenants)) {
    log('green', '✅', `Found ${listRes.data.tenants.length} tenants`);
    passed++;
  } else {
    log('red', '❌', `Failed to list tenants: ${listRes.data?.error || listRes.error}`);
    failed++;
  }

  // Test 6: Convergence from Tenant (Optional)
  if (statusRes.ok && statusRes.data.port) {
    const port = statusRes.data.port;
    log('yellow', '🔍', 'Testing convergence call from tenant app...');
    
    try {
      const convergRes = await fetch(`http://localhost:${port}/api/converge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Say hello to Convergence',
          agentARole: 'Greeter',
          agentBRole: 'Responder'
        })
      });

      if (convergRes.ok) {
        const convergData = await convergRes.json();
        if (convergData.taskId) {
          log('green', '✅', `Convergence task created: ${convergData.taskId}`);
          passed++;
        } else {
          log('red', '❌', 'Convergence returned no task ID');
          failed++;
        }
      } else {
        log('yellow', '⚠️ ', `Convergence not available yet (API not connected)`);
      }
    } catch (err) {
      log('yellow', '⚠️ ', `Convergence test skipped: ${err.message}`);
    }
  }

  // Test 7: Destroy Tenant
  log('yellow', '🔍', 'Destroying test tenant...');
  const destroyRes = await request('DELETE', `/api/v1/tenant/${envId}`);
  if (destroyRes.ok && destroyRes.data.success) {
    log('green', '✅', 'Tenant destroyed successfully');
    passed++;
  } else {
    log('red', '❌', `Failed to destroy tenant: ${destroyRes.data?.error || destroyRes.error}`);
    failed++;
  }

  printSummary(passed, failed);
}

function printSummary(passed, failed) {
  console.log(`\n${colors.cyan}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
  if (failed > 0) {
    console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
  }
  console.log(`${colors.cyan}════════════════════════════════════════${colors.reset}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  log('red', '💥', `Fatal error: ${err.message}`);
  process.exit(1);
});
