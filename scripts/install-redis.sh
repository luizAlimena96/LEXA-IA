#!/bin/bash

# Redis Installation Script for Ubuntu 22.04
# Run this script on your VM with: sudo bash install-redis.sh

set -e  # Exit on error

echo "=================================================="
echo "  Redis Installation for LEXA - Ubuntu 22.04"
echo "=================================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root: sudo bash install-redis.sh"
    exit 1
fi

echo "📦 Step 1: Updating package list..."
apt-get update -qq

echo "📦 Step 2: Installing Redis Server..."
apt-get install -y redis-server

echo "⚙️  Step 3: Configuring Redis..."
# Backup original config
cp /etc/redis/redis.conf /etc/redis/redis.conf.backup

# Configure Redis for production
sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf
sed -i 's/^# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy noeviction/' /etc/redis/redis.conf

# Enable persistence
sed -i 's/^save ""/# save ""/' /etc/redis/redis.conf
echo 'save 900 1' >> /etc/redis/redis.conf
echo 'save 300 10' >> /etc/redis/redis.conf
echo 'save 60 10000' >> /etc/redis/redis.conf

echo "🚀 Step 4: Starting Redis service..."
systemctl restart redis-server
systemctl enable redis-server

echo "✅ Step 5: Verifying installation..."
sleep 2

if systemctl is-active --quiet redis-server; then
    echo "✅ Redis is running!"
else
    echo "❌ Redis failed to start. Check logs: sudo journalctl -u redis-server"
    exit 1
fi

# Test Redis connection
if redis-cli ping | grep -q PONG; then
    echo "✅ Redis connection test: SUCCESS"
else
    echo "❌ Redis connection test: FAILED"
    exit 1
fi

echo ""
echo "=================================================="
echo "  ✅ Redis Installation Complete!"
echo "=================================================="
echo ""
echo "📊 Redis Status:"
systemctl status redis-server --no-pager | head -n 5
echo ""
echo "🔧 Redis Info:"
redis-cli info server | grep redis_version
echo ""
echo "💾 Memory Configuration:"
redis-cli config get maxmemory
echo ""
echo "📝 Next Steps:"
echo "1. Add Redis environment variables to your .env file"
echo "2. Install Node.js dependencies: cd /path/to/lexa && npm install"
echo "3. Restart your Next.js application"
echo ""
echo "🔍 Useful Commands:"
echo "  - Check status: sudo systemctl status redis-server"
echo "  - View logs: sudo journalctl -u redis-server -f"
echo "  - Redis CLI: redis-cli"
echo "  - Test connection: redis-cli ping"
echo ""
