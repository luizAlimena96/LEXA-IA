#!/bin/bash

# Quick fix script for Redis eviction policy
# Run this on your server: sudo bash fix-redis-now.sh

echo "🔧 Fixing Redis eviction policy..."

# Fix 1: Set eviction policy immediately (temporary until restart)
redis-cli CONFIG SET maxmemory-policy noeviction
echo "✅ Set eviction policy to noeviction (temporary)"

# Fix 2: Update config file permanently
if [ -f /etc/redis/redis.conf ]; then
    sudo sed -i 's/maxmemory-policy allkeys-lru/maxmemory-policy noeviction/' /etc/redis/redis.conf
    echo "✅ Updated redis.conf permanently"
else
    echo "⚠️  Could not find /etc/redis/redis.conf"
fi

# Verify
POLICY=$(redis-cli CONFIG GET maxmemory-policy | tail -n 1)
echo ""
echo "Current eviction policy: $POLICY"

if [ "$POLICY" = "noeviction" ]; then
    echo "✅ Redis is now configured correctly!"
else
    echo "❌ Failed to set eviction policy"
fi

echo ""
echo "Note: Redis version $(redis-cli INFO server | grep redis_version | cut -d: -f2)"
echo "Recommended: Upgrade to Redis 6.2.0+ when possible"
