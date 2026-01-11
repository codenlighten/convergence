# Convergence Tenant Provisioning Guide

## Overview

Convergence supports **dynamic tenant provisioning** - spinning up isolated Docker containers that each run tenant applications and communicate with the parent Convergence API for intelligent decision-making.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│      Convergence Master (Parent)                    │
│  ┌─────────────────────────────────────────────┐   │
│  │  API Server (port 3000)                     │   │
│  │  - /api/v1/converge       (sync/async)      │   │
│  │  - /api/v1/tenant/*       (provisioning)    │   │
│  │  - /api/v1/status/:taskId (async results)   │   │
│  └─────────────────────────────────────────────┘   │
└────────────────┬──────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Tenant  │  │ Tenant  │  │ Tenant  │
│ App 1   │  │ App 2   │  │ App N   │
│(Docker) │  │(Docker) │  │(Docker) │
│ Port    │  │ Port    │  │ Port    │
│ 3001    │  │ 3002    │  │ 300N    │
└─────────┘  └─────────┘  └─────────┘
```

## Endpoints

### Spawn a New Tenant

```
POST /api/v1/tenant/spawn

Request Body:
{
  "name": "acme-corp-ai",
  "language": "node",
  "framework": "express",
  "description": "AI decision engine for ACME Corp"
}

Response:
{
  "success": true,
  "tenant": {
    "envId": 1,
    "name": "acme-corp-ai",
    "orgId": 1,
    "status": "running",
    "port": 3001,
    "apiKey": "sk_tenant_...",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### Get Tenant Status

```
GET /api/v1/tenant/:envId/status

Response:
{
  "envId": 1,
  "name": "acme-corp-ai",
  "status": "running",
  "containerName": "convergence-tenant-1",
  "port": 3001,
  "uptime": 3600,
  "cpuUsage": "12.5%",
  "memoryUsage": "128MB"
}
```

### Get Tenant Logs

```
GET /api/v1/tenant/:envId/logs

Response:
{
  "logs": [
    "2024-01-15T10:00:00Z [INFO] Starting tenant app...",
    "2024-01-15T10:00:01Z [INFO] Connected to parent API",
    "2024-01-15T10:00:02Z [INFO] Listening on port 3000"
  ]
}
```

### Destroy Tenant

```
DELETE /api/v1/tenant/:envId

Response:
{
  "success": true,
  "result": "Environment removed successfully"
}
```

### List Tenants

```
GET /api/v1/tenant?org_id=1

Response:
{
  "tenants": [
    {
      "envId": 1,
      "name": "acme-corp-ai",
      "status": "running",
      "port": 3001,
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "envId": 2,
      "name": "globex-analysis",
      "status": "running",
      "port": 3002,
      "createdAt": "2024-01-15T10:15:00Z"
    }
  ]
}
```

## Using Convergence Inside Tenant Apps

### Installation

```bash
npm install convergence-client
```

### Basic Usage

```javascript
import { ConvergenceClient } from 'convergence-client';

const convergence = new ConvergenceClient({
  apiUrl: 'http://convergence-api:3000/api/v1',
  apiKey: process.env.CONVERGENCE_API_KEY,
  tenantId: process.env.TENANT_ID
});

// Design something
const design = await convergence.design('Design a scalable microservices architecture for an e-commerce platform');

// Review code
const review = await convergence.review(codeString);

// Make a decision
const decision = await convergence.decide('Should we refactor this module?', contextInfo);

// Custom convergence
const result = await convergence.converge(prompt, {
  agentARole: 'Product Manager',
  agentBRole: 'Technical Architect',
  maxIterations: 8
});

// Check async results
const status = await convergence.status(taskId);
```

## Tenant Environment Variables

When a tenant is spawned, these environment variables are automatically set:

| Variable | Description |
|----------|-------------|
| `CONVERGENCE_API_URL` | Parent API URL (e.g., `http://host.docker.internal:8000/api/v1`) |
| `CONVERGENCE_API_KEY` | API key for authenticating with parent |
| `CONVERGENCE_ORG_ID` | Organization ID |
| `CONVERGENCE_ENV_ID` | Unique environment ID (used for isolation) |
| `TENANT_ID` | Tenant identifier |
| `TENANT_NAME` | Human-readable tenant name |
| `NODE_ENV` | Always `production` |
| `LOG_LEVEL` | Logging level (default: `info`) |

## Tenant Starter Template

A pre-built Express.js starter template is provided at:
- `tenant-templates/node-express-index.js`
- `tenant-templates/Dockerfile`
- `tenant-templates/docker-compose.yml`

### Getting Started

1. **Spawn a tenant:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/tenant/spawn \
     -H "Content-Type: application/json" \
     -d '{
       "name": "my-app",
       "language": "node",
       "framework": "express"
     }'
   ```

2. **Get the port:**
   ```bash
   curl http://localhost:3000/api/v1/tenant/1/status | jq '.port'
   # Output: 3001
   ```

3. **Call your tenant app:**
   ```bash
   curl -X POST http://localhost:3001/api/converge \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "Design a user authentication system",
       "agentARole": "Security Expert",
       "agentBRole": "User Experience Designer"
     }'
   ```

## Database Schema

Tenants are tracked in two tables:

### `organizations`
```sql
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### `environments`
```sql
CREATE TABLE environments (
  id SERIAL PRIMARY KEY,
  orgId INTEGER NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'provisioning',
  containerName VARCHAR(255) UNIQUE,
  port INTEGER UNIQUE,
  apiKey VARCHAR(255) UNIQUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

## Billing & Metering

Each tenant's convergence calls are tracked by:
- **API Key**: Unique per tenant
- **ENV_ID**: Isolated execution context
- **Convergence Score**: Quality metric

Usage is aggregated by organization:
```javascript
GET /api/v1/usage?org_id=1

{
  "orgId": 1,
  "tenants": 3,
  "totalConvergenceRequests": 1250,
  "totalTokensUsed": 450000,
  "estimatedCost": 3.50,
  "period": "2024-01-01T00:00:00Z to 2024-01-31T23:59:59Z"
}
```

## Deployment

### Docker Compose (Development)

```bash
# Spawn tenant with Docker Compose
docker-compose -f convergence-tenant-1-compose.yml up -d

# View logs
docker-compose -f convergence-tenant-1-compose.yml logs -f

# Stop
docker-compose -f convergence-tenant-1-compose.yml down
```

### Kubernetes (Production)

Tenant manifests are auto-generated for Kubernetes:
- ConfigMap: tenant configuration
- Secret: API keys
- Deployment: tenant pod
- Service: internal networking

## Advanced: Custom Tenant Images

You can provision tenants with custom base images:

```javascript
const tenant = await provisionTenant(orgId, {
  name: 'python-ml-app',
  language: 'python',
  baseImage: 'python:3.12-slim'
});
```

## Troubleshooting

### Tenant Can't Connect to Parent API

**Error:**
```
Convergence API error: ECONNREFUSED 127.0.0.1:3000
```

**Solution:**
- Use `http://host.docker.internal:3000` instead of `http://localhost:3000`
- Or use `http://convergence-api:3000` if on same Docker network

### Out of Memory

**Error:**
```
Killed: 9 (out of memory)
```

**Solution:**
- Increase memory limit in docker-compose.yml
- Reduce `maxIterations` in convergence calls
- Optimize prompt length

### Port Already in Use

**Error:**
```
Bind for 0.0.0.0:3001 failed: port is already allocated
```

**Solution:**
- Check `docker ps` for conflicting containers
- Remove stopped containers: `docker container prune`

## Best Practices

1. **API Keys**: Always use strong, unique keys per tenant
2. **Rate Limiting**: Configure rate limits per tenant to prevent abuse
3. **Monitoring**: Track convergence scores to measure decision quality
4. **Isolation**: Run tenants on separate networks for security
5. **Backups**: Store tenant data in persistent volumes
6. **Logging**: Centralize logs for audit trails
7. **Scaling**: Use Kubernetes for multi-tenant deployments

## Example: Building a Tenant App

See `tenant-templates/node-express-index.js` for a complete working example with:
- Health checks
- Convergence endpoints
- Error handling
- Logging
