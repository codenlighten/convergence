# Convergence Engine - Deployment Guide

## Your Droplet Info
- **IP:** 134.209.4.149
- **User:** root
- **Region:** DigitalOcean

## Quick Deployment (Choose One)

### Option 1: Quick Setup (Recommended for testing)

```bash
# From your local machine
scp setup.sh root@134.209.4.149:/root/
ssh root@134.209.4.149
bash /root/setup.sh
```

Then edit the .env file:
```bash
nano /root/convergence/.env
# Add your OPENAI_API_KEY
```

Verify it's running:
```bash
pm2 status
pm2 logs convergence-api
```

### Option 2: Docker Deployment (Recommended for production)

```bash
# Copy files to droplet
scp -r . root@134.209.4.149:/root/convergence/

# SSH and start services
ssh root@134.209.4.149
cd /root/convergence

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
bash get-docker.sh

# Create .env file
cat > .env << EOF
OPENAI_API_KEY=your-key-here
EOF

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f convergence
```

### Option 3: Manual Setup

```bash
ssh root@134.209.4.149

# Update and install
apt update && apt upgrade -y
apt install -y nodejs npm git

# Clone repo (adjust URL)
cd /root
git clone https://github.com/yourusername/convergence.git
cd convergence

# Install deps
npm install

# Create .env
cat > .env << EOF
OPENAI_API_KEY=your-key-here
EOF

# Install PM2
npm install -g pm2
pm2 start index.js --name "convergence"
pm2 startup
pm2 save
```

---

## Useful Commands

```bash
# SSH into droplet
ssh root@134.209.4.149

# Copy files to droplet
scp myfile.txt root@134.209.4.149:/root/

# Copy folder to droplet
scp -r ./examples root@134.209.4.149:/root/convergence/

# View PM2 status
pm2 status
pm2 logs convergence-api

# Docker commands
docker-compose up -d
docker-compose down
docker-compose logs -f

# Check what's running
ps aux | grep node
```

---

## Firewall Setup (if using ufw)

```bash
ssh root@134.209.4.149
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Convergence API
ufw enable
```

---

## API Endpoint Example

Once running, you can call Convergence from anywhere:

```bash
# Test with curl
curl -X POST http://134.209.4.149:3000/converge \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Design a REST API",
    "maxIterations": 5
  }'
```

---

## Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU
top

# Check logs
journalctl -u convergence -f  # systemd
pm2 logs convergence-api      # PM2
docker-compose logs -f         # Docker
```

---

## Troubleshooting

**Can't SSH?**
```bash
# Check firewall
sudo ufw status
sudo ufw allow 22/tcp

# Check SSH service
sudo systemctl status ssh
sudo systemctl restart ssh
```

**PM2 process died?**
```bash
pm2 status
pm2 restart convergence-api
pm2 logs convergence-api
```

**Docker won't start?**
```bash
docker-compose down
docker-compose up -d
docker-compose logs convergence
```

**Out of disk space?**
```bash
# Clean Docker
docker system prune -a

# Clean npm cache
npm cache clean --force
```

---

## Next: Multi-Tenant Platform

Once the basic deployment works, you can:

1. **Add API Layer** - Create Express server to handle requests
2. **Add Database** - PostgreSQL for multi-tenant data
3. **Add Auth** - JWT authentication for API users
4. **Add Billing** - Track usage and costs per tenant
5. **Scale** - Multiple instances behind load balancer

See `STRATEGIC_VISION.md` for the full platform roadmap.

---

## Support

For issues:
1. Check logs: `pm2 logs` or `docker-compose logs`
2. Verify .env has OPENAI_API_KEY
3. Check droplet resources: `df -h`, `free -h`
4. Restart service: `pm2 restart convergence-api`

You're now running Convergence Engine on DigitalOcean! 🚀
