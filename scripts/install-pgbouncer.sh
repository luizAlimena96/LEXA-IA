#!/bin/bash

# PgBouncer Installation Script for Ubuntu 22.04
# Connection pooler for PostgreSQL to reduce connection overhead
# Run this script on your VM with: sudo bash install-pgbouncer.sh

set -e  # Exit on error

echo "=================================================="
echo "  PgBouncer Installation for LEXA - Ubuntu 22.04"
echo "=================================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root: sudo bash install-pgbouncer.sh"
    exit 1
fi

echo "📦 Step 1: Updating package list..."
apt-get update -qq

echo "📦 Step 2: Installing PgBouncer..."
apt-get install -y pgbouncer

echo "⚙️  Step 3: Configuring PgBouncer..."

# Backup original config
cp /etc/pgbouncer/pgbouncer.ini /etc/pgbouncer/pgbouncer.ini.backup

# Prompt for database credentials
read -p "Enter PostgreSQL database name [lexa]: " DB_NAME
DB_NAME=${DB_NAME:-lexa}

read -p "Enter PostgreSQL username: " DB_USER
read -sp "Enter PostgreSQL password: " DB_PASSWORD
echo ""

read -p "Enter PostgreSQL host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter PostgreSQL port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

# Create PgBouncer configuration
cat > /etc/pgbouncer/pgbouncer.ini <<EOF
;; PgBouncer Configuration for LEXA
;; Optimized for Next.js + Prisma

[databases]
${DB_NAME} = host=${DB_HOST} port=${DB_PORT} dbname=${DB_NAME}

[pgbouncer]
;;;
;;; Administrative settings
;;;
logfile = /var/log/postgresql/pgbouncer.log
pidfile = /var/run/postgresql/pgbouncer.pid

;;;
;;; Connection pooling settings
;;;
listen_addr = 127.0.0.1
listen_port = 6432

; Authentication type
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

; Pool mode (transaction is best for Prisma)
pool_mode = transaction

; Connection limits
max_client_conn = 100
default_pool_size = 5
reserve_pool_size = 2
reserve_pool_timeout = 5

; Server connection settings
server_lifetime = 3600
server_idle_timeout = 600
server_connect_timeout = 15
server_login_retry = 15

; Client connection settings
client_idle_timeout = 0
client_login_timeout = 60

; DNS settings
dns_max_ttl = 15
dns_zone_check_period = 0

; TLS settings (disabled for local connections)
;client_tls_sslmode = disable
;server_tls_sslmode = disable

; Logging
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1

; Stats
stats_period = 60

; Dangerous timeouts
query_timeout = 0
query_wait_timeout = 120
cancel_wait_timeout = 10
idle_transaction_timeout = 0

; Low-level tuning
pkt_buf = 4096
listen_backlog = 128
sbuf_loopcnt = 5
max_packet_size = 2147483647

; Ignore startup parameters
ignore_startup_parameters = extra_float_digits

; Disable prepared statements (required for transaction pooling)
server_reset_query = DISCARD ALL
server_check_query = select 1
server_check_delay = 30
EOF

echo "⚙️  Step 4: Creating user authentication file..."

# Generate MD5 hash for password
# Format: "username" "md5" + md5(password + username)
PASSWORD_HASH=$(echo -n "${DB_PASSWORD}${DB_USER}" | md5sum | awk '{print $1}')

cat > /etc/pgbouncer/userlist.txt <<EOF
"${DB_USER}" "md5${PASSWORD_HASH}"
EOF

# Set proper permissions
chmod 640 /etc/pgbouncer/userlist.txt
chown postgres:postgres /etc/pgbouncer/userlist.txt

echo "🚀 Step 5: Starting PgBouncer service..."
systemctl restart pgbouncer
systemctl enable pgbouncer

echo "✅ Step 6: Verifying installation..."
sleep 2

if systemctl is-active --quiet pgbouncer; then
    echo "✅ PgBouncer is running!"
else
    echo "❌ PgBouncer failed to start. Check logs: sudo journalctl -u pgbouncer"
    exit 1
fi

echo ""
echo "=================================================="
echo "  ✅ PgBouncer Installation Complete!"
echo "=================================================="
echo ""
echo "📊 PgBouncer Status:"
systemctl status pgbouncer --no-pager | head -n 5
echo ""
echo "🔧 Connection Info:"
echo "  Host: localhost"
echo "  Port: 6432"
echo "  Database: ${DB_NAME}"
echo "  Pool Mode: transaction"
echo "  Max Connections: 100 (client) → 5 (PostgreSQL)"
echo ""
echo "📝 Next Steps:"
echo "1. Update your .env file with:"
echo "   DATABASE_URL=\"postgresql://${DB_USER}:${DB_PASSWORD}@localhost:6432/${DB_NAME}?pgbouncer=true&connection_limit=5&pool_timeout=10\""
echo "   DIRECT_URL=\"postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}\""
echo ""
echo "2. Restart your Next.js application:"
echo "   pm2 restart lexa"
echo ""
echo "🔍 Useful Commands:"
echo "  - Check status: sudo systemctl status pgbouncer"
echo "  - View logs: sudo journalctl -u pgbouncer -f"
echo "  - Show pools: psql -h localhost -p 6432 -U ${DB_USER} -d pgbouncer -c 'SHOW POOLS;'"
echo "  - Show stats: psql -h localhost -p 6432 -U ${DB_USER} -d pgbouncer -c 'SHOW STATS;'"
echo ""
