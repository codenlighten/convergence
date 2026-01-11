/**
 * PostgreSQL Tenant Provisioning Schema
 * Extends existing multi-tenant schema for app environments
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://convergence_user:convergence_pass@localhost:5432/convergence'
});

/**
 * Migration: 002_tenant_environments
 */
async function migration002() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Tenant environments (sandboxed apps)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_environments (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        language VARCHAR(50) DEFAULT 'node',
        framework VARCHAR(100),
        description TEXT,
        status VARCHAR(50) DEFAULT 'provisioning',
        container_id VARCHAR(255),
        container_port INTEGER,
        docker_image VARCHAR(255),
        storage_path VARCHAR(512),
        cpu_limit NUMERIC(3,2) DEFAULT 0.5,
        memory_limit_mb INTEGER DEFAULT 512,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(org_id, name)
      );
    `);

    // Container status tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_containers (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        env_id INTEGER NOT NULL REFERENCES tenant_environments(id) ON DELETE CASCADE,
        container_id VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(50) DEFAULT 'starting',
        health_check_passed BOOLEAN DEFAULT FALSE,
        last_health_check TIMESTAMP,
        cpu_percent NUMERIC(5,2),
        memory_bytes INTEGER,
        uptime_seconds INTEGER,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Provisioning logs and audit trail
    await client.query(`
      CREATE TABLE IF NOT EXISTS provisioning_logs (
        id SERIAL PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        env_id INTEGER NOT NULL REFERENCES tenant_environments(id) ON DELETE CASCADE,
        action VARCHAR(100),
        status VARCHAR(50),
        message TEXT,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tenant API calls tracking (for billing)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_api_calls (
        id SERIAL PRIMARY KEY,
        env_id INTEGER NOT NULL REFERENCES tenant_environments(id) ON DELETE CASCADE,
        endpoint VARCHAR(255),
        method VARCHAR(10),
        response_code INTEGER,
        response_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tenant_api_created (env_id, created_at)
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_env_org ON tenant_environments(org_id);
      CREATE INDEX IF NOT EXISTS idx_env_status ON tenant_environments(status);
      CREATE INDEX IF NOT EXISTS idx_container_env ON tenant_containers(env_id);
      CREATE INDEX IF NOT EXISTS idx_provisioning_env ON provisioning_logs(env_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Migration 002: Tenant provisioning schema created');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function runMigration() {
  try {
    await migration002();
    await pool.end();
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}
