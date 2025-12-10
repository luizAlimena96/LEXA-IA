# Redis Configuration Template
# Copy these variables to your .env file

```bash
# ====================================
# APPLICATION CONFIGURATION
# ====================================

# Application port (default: 3000)
PORT=3001

# ====================================
# REDIS CONFIGURATION (BullMQ Queues)
# ====================================

# Redis host (use 'localhost' for local development)
REDIS_HOST=localhost

# Redis port (default: 6379)
REDIS_PORT=6379

# Redis password (leave empty if no password)
REDIS_PASSWORD=

# Redis database number (default: 0)
REDIS_DB=0

# ====================================
# QUEUE CONFIGURATION
# ====================================

# Number of concurrent jobs per worker (default: 5)
QUEUE_CONCURRENCY=5

# Maximum number of retry attempts (default: 3)
QUEUE_MAX_RETRIES=3
```

## Add to your .env file

Copy the variables above and add them to your `.env` file in the root of the project.
