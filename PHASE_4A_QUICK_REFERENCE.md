# Phase 4A Quick Reference

## What You Get

**Convergence Tenant Provisioning** - Dynamic Docker container spawning for tenant applications.

## Quick Start

### Spawn a Tenant
```bash
curl -X POST http://localhost:3000/api/v1/tenant/spawn \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-app",
    "language": "node",
    "framework": "express"
  }'
```

**Response:**
```json
{
  "success": true,
  "tenant": {
    "envId": 1,
    "port": 3001,
    "apiKey": "sk_tenant_..."
  }
}
```

### Check Status
```bash
curl http://localhost:3000/api/v1/tenant/1/status
```

### Call Convergence from Tenant
```bash
curl -X POST http://localhost:3001/api/converge \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Design a system",
    "agentARole": "Architect",
    "agentBRole": "Reviewer"
  }'
```

### List Tenants
```bash
curl http://localhost:3000/api/v1/tenant?org_id=1
```

### Destroy Tenant
```bash
curl -X DELETE http://localhost:3000/api/v1/tenant/1
```

## Key Features

| Feature | What It Does |
|---------|-------------|
| **Isolation** | Each tenant in separate Docker container |
| **Security** | Unique API keys per tenant |
| **Scaling** | Auto-increment ports (3001, 3002, 3003...) |
| **Monitoring** | Health checks + container logs |
| **Billing** | Track convergence calls per tenant |

## Files Changed

| File | What's New |
|------|-----------|
| `api/server.js` | +5 tenant endpoints |
| `api/tenant-service.js` | Core provisioning logic |
| `db/migrations-tenant.js` | Database schema |
| `tenant-templates/` | Starter Docker app |
| `package.json` | +uuid dependency |
| `TENANT_PROVISIONING.md` | Full documentation |

## Environment Variables (Tenant)

Auto-set by provisioning system:
```
CONVERGENCE_API_URL=http://host.docker.internal:3000/api/v1
CONVERGENCE_API_KEY=sk_tenant_...
CONVERGENCE_ORG_ID=1
CONVERGENCE_ENV_ID=1
TENANT_ID=tenant_1
TENANT_NAME=my-app
```

## Deployment

### Development
```bash
npm install
npm run migrate
npm start:api
```

### Production (DigitalOcean)
1. SSH into droplet
2. `git pull && npm install && npm run migrate`
3. Restart with `pm2 restart convergence-api`
4. Test: `curl http://localhost:3000/api/v1/tenant/spawn -d {...}`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full steps.

## Common Tasks

### View Logs
```bash
docker logs convergence-tenant-1
```

### List Containers
```bash
docker ps -a
```

### Get Usage Stats
```bash
curl http://localhost:3000/api/v1/usage?org_id=1
```

### Test Tenant Provisioning
```bash
node test/test-tenant-provisioning.js
```

## Architecture

```
Master API (port 3000)
    ↓
[Tenant 1: 3001] [Tenant 2: 3002] [Tenant N: 300N]
    ↓                  ↓                  ↓
  Converge         Converge          Converge
```

## Error Handling

| Error | Solution |
|-------|----------|
| Docker not found | `systemctl start docker` |
| Port in use | Check `docker ps` for conflicts |
| API key missing | Set `CONVERGENCE_API_KEY` env var |
| Cannot reach parent | Use `host.docker.internal` in container |
| Database error | Run `npm run migrate` |

## Next Phase (4B)

- JWT authentication
- Stripe billing integration
- Prometheus monitoring
- Kubernetes support

---

**Status:** ✅ Phase 4A Complete  
**Commits:** 3 major pushes to GitHub  
**Ready for:** Production deployment
