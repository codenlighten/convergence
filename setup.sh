#!/bin/bash
# Convergence Engine - Automated Deployment Script
# Run on DigitalOcean Droplet: bash setup.sh

set -e

echo "🚀 Starting Convergence Engine Deployment..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js
echo "📦 Installing Node.js and npm..."
apt install -y nodejs npm git curl wget build-essential

# Install PM2 for process management
echo "📦 Installing PM2..."
npm install -g pm2

# Create app directory
echo "📁 Creating application directory..."
mkdir -p /root/convergence
cd /root/convergence

# Clone the repository
echo "📥 Cloning Convergence Engine repository..."
# If using HTTPS (no SSH key needed for public repo):
git clone https://github.com/Coden/convergence.git . 2>/dev/null || echo "Note: Update repo URL if needed"

# Alternative: If you have a private repo, use SSH
# git clone git@github.com:Coden/convergence.git .

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Create .env file (user will edit this)
echo "🔐 Creating .env file..."
if [ ! -f .env ]; then
    cat > .env << 'EOF'
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_DEFAULT_MODEL=gpt-4o-mini
OPENAI_DEFAULT_TEMPERATURE=0.7
NODE_ENV=production
PORT=3000
EOF
    echo "⚠️  Created .env file - EDIT THIS with your OpenAI API key!"
else
    echo "✅ .env file already exists"
fi

# Run tests
echo "🧪 Running tests..."
npm test 2>/dev/null || echo "⚠️  Some tests require OPENAI_API_KEY"

# Start with PM2
echo "🎯 Starting Convergence Engine with PM2..."
pm2 start index.js --name "convergence-api"
pm2 startup
pm2 save

# Create systemd service for API (optional, for HTTP server)
echo "📋 Creating systemd service..."
sudo tee /etc/systemd/system/convergence.service > /dev/null << 'EOF'
[Unit]
Description=Convergence Engine
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/convergence
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
EnvironmentFile=/root/convergence/.env

[Install]
WantedBy=multi-user.target
EOF

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 NEXT STEPS:"
echo "1. Edit .env file with your OpenAI API key:"
echo "   nano /root/convergence/.env"
echo ""
echo "2. Verify PM2 is running:"
echo "   pm2 status"
echo ""
echo "3. View logs:"
echo "   pm2 logs convergence-api"
echo ""
echo "4. Test convergence:"
echo "   node examples/industries/healthcare-database.js"
echo ""
echo "🔧 Useful Commands:"
echo "   pm2 start convergence-api"
echo "   pm2 stop convergence-api"
echo "   pm2 restart convergence-api"
echo "   pm2 logs convergence-api"
echo ""
echo "📊 Server IP: $(hostname -I | awk '{print $1}')"
echo ""
