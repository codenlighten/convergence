/**
 * Database utilities for Convergence Engine
 */

import pg from 'pg';
const { Pool } = pg;

let pool = null;

export function initPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://convergence_user:convergence_pass@localhost:5432/convergence',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
  }
  return pool;
}

export async function getPool() {
  return initPool();
}

/**
 * Find organization and API key by key hash
 */
export async function getOrgByApiKey(keyHash) {
  const pool = initPool();
  const res = await pool.query(
    `SELECT o.id, o.uuid, o.name, o.plan, ak.id as api_key_id 
     FROM api_keys ak 
     JOIN organizations o ON ak.org_id = o.id 
     WHERE ak.key_hash = $1 AND ak.status = 'active' AND o.status = 'active'`,
    [keyHash]
  );
  return res.rows[0] || null;
}

/**
 * Store convergence result in database
 */
export async function storeConvergence(orgId, apiKeyId, taskId, data) {
  const pool = initPool();
  const {
    prompt,
    agentARole,
    agentBRole,
    maxIterations,
    model,
    result,
    startTime
  } = data;

  const durationMs = Date.now() - startTime;

  try {
    const res = await pool.query(
      `INSERT INTO convergence_history (
        org_id, api_key_id, task_id, prompt, agent_a_role, agent_b_role, 
        max_iterations, model, result, converged, convergence_score, iterations,
        tokens_prompt, tokens_completion, tokens_total, estimated_cost, duration_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id, uuid`,
      [
        orgId, apiKeyId, taskId, prompt, agentARole, agentBRole,
        maxIterations, model, JSON.stringify(result), result.converged,
        result.convergenceScore, result.iterations,
        result.tokens?.prompt || 0,
        result.tokens?.completion || 0,
        result.tokens?.total || 0,
        result.estimatedCost || 0,
        durationMs
      ]
    );

    // Update usage tracking
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `INSERT INTO usage_tracking (org_id, period_start, period_end, convergences, total_tokens, total_cost, api_calls)
       VALUES ($1, $2, $2, 1, $3, $4, 1)
       ON CONFLICT (org_id, period_start, period_end) 
       DO UPDATE SET 
         convergences = usage_tracking.convergences + 1,
         total_tokens = usage_tracking.total_tokens + $3,
         total_cost = usage_tracking.total_cost + $4,
         api_calls = usage_tracking.api_calls + 1,
         updated_at = CURRENT_TIMESTAMP`,
      [orgId, today, result.tokens?.total || 0, result.estimatedCost || 0]
    );

    return res.rows[0];
  } catch (err) {
    console.error('Failed to store convergence:', err);
    throw err;
  }
}

/**
 * Get usage stats for org
 */
export async function getUsageStats(orgId, days = 30) {
  const pool = initPool();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const res = await pool.query(
    `SELECT 
       SUM(convergences) as total_convergences,
       SUM(total_tokens) as total_tokens,
       SUM(total_cost) as total_cost,
       SUM(api_calls) as total_api_calls,
       AVG(total_cost) as avg_cost_per_day
     FROM usage_tracking
     WHERE org_id = $1 AND period_start >= $2`,
    [orgId, startDate.toISOString().split('T')[0]]
  );

  return res.rows[0] || {
    total_convergences: 0,
    total_tokens: 0,
    total_cost: 0,
    total_api_calls: 0,
    avg_cost_per_day: 0
  };
}

/**
 * Get convergence history for org
 */
export async function getConvergenceHistory(orgId, limit = 20, offset = 0) {
  const pool = initPool();
  const res = await pool.query(
    `SELECT 
       id, uuid, task_id, prompt, converged, convergence_score, iterations,
       tokens_total, estimated_cost, duration_ms, created_at
     FROM convergence_history
     WHERE org_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [orgId, limit, offset]
  );
  return res.rows;
}

/**
 * Close pool
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
