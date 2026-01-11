/**
 * PostgreSQL Migration System
 * Creates multi-tenant schema for Convergence Engine
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://convergence_user:convergence_pass@localhost:5432/convergence'
});

/**
 * Migration: 001_create_schema
 */
async function migration001() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Organizations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        plan VARCHAR(50) DEFAULT 'free',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'member',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(org_id, email)
      );
    `);

    // API Keys table
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        key_hash VARCHAR(255) NOT NULL UNIQUE,
        key_prefix VARCHAR(20) NOT NULL,
        name VARCHAR(255),
        last_used TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Convergence History table
    await client.query(`
      CREATE TABLE IF NOT EXISTS convergence_history (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        api_key_id INTEGER NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
        task_id UUID NOT NULL,
        prompt TEXT NOT NULL,
        agent_a_role TEXT,
        agent_b_role TEXT,
        max_iterations INTEGER DEFAULT 8,
        model VARCHAR(100),
        result JSONB,
        converged BOOLEAN,
        convergence_score INTEGER,
        iterations INTEGER,
        tokens_prompt INTEGER,
        tokens_completion INTEGER,
        tokens_total INTEGER,
        estimated_cost NUMERIC(10, 8),
        duration_ms INTEGER,
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for convergence_history
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_convergence_org_created ON convergence_history(org_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_convergence_task_id ON convergence_history(task_id);
      CREATE INDEX IF NOT EXISTS idx_convergence_status ON convergence_history(status);
    `);

    // Usage Tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS usage_tracking (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        convergences INTEGER DEFAULT 0,
        total_tokens INTEGER DEFAULT 0,
        total_cost NUMERIC(12, 8) DEFAULT 0,
        api_calls INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(org_id, period_start, period_end)
      );
    `);

    // Webhooks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS webhooks (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        events TEXT[] DEFAULT ARRAY['convergence.completed'],
        secret VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Webhook Events table (audit trail)
    await client.query(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id SERIAL PRIMARY KEY,
        webhook_id INTEGER NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
        event_type VARCHAR(100),
        payload JSONB,
        status VARCHAR(50),
        attempts INTEGER DEFAULT 0,
        last_error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(org_id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
      CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
      CREATE INDEX IF NOT EXISTS idx_convergence_org ON convergence_history(org_id);
      CREATE INDEX IF NOT EXISTS idx_usage_org ON usage_tracking(org_id);
      CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhooks(org_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Migration 001: Schema created successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Seed initial organization and API key for testing
 */
async function seedTestData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create test org
    const orgRes = await client.query(
      `INSERT INTO organizations (name, slug, plan) VALUES ($1, $2, $3) 
       ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug 
       RETURNING id, uuid`,
      ['Test Organization', 'test-org', 'free']
    );
    const orgId = orgRes.rows[0].id;
    const orgUuid = orgRes.rows[0].uuid;

    // Create test user
    const userRes = await client.query(
      `INSERT INTO users (org_id, email, name, role) VALUES ($1, $2, $3, $4) 
       ON CONFLICT (org_id, email) DO UPDATE SET email = EXCLUDED.email 
       RETURNING id, uuid`,
      [orgId, 'admin@test.org', 'Test Admin', 'admin']
    );
    const userId = userRes.rows[0].id;

    console.log('✅ Test data seeded');
    console.log(`   Org UUID: ${orgUuid}`);
    console.log(`   User UUID: ${userRes.rows[0].uuid}`);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.warn('⚠️  Test data seed skipped (may already exist)');
  } finally {
    client.release();
  }
}

/**
 * Run all migrations
 */
export async function runMigrations() {
  try {
    console.log('🔄 Running migrations...\n');
    await migration001();
    await seedTestData();
    console.log('\n✅ All migrations complete');
    await pool.end();
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}
