// Redis Connection Configuration
// Singleton pattern to ensure only one Redis connection

import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisConnection(): Redis {
    if (!redisClient) {
        const redisHost = process.env.REDIS_HOST || '127.0.0.1';
        const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
        const redisPassword = process.env.REDIS_PASSWORD;
        const redisDb = parseInt(process.env.REDIS_DB || '0', 10);

        console.log('[Redis] Connecting to Redis...', {
            host: redisHost,
            port: redisPort,
            db: redisDb,
            hasPassword: !!redisPassword,
        });

        redisClient = new Redis({
            host: redisHost,
            port: redisPort,
            password: redisPassword,
            db: redisDb,

            // CRITICAL: BullMQ requirement
            maxRetriesPerRequest: null,

            // SECURITY: Fail-fast retry strategy (max 3 attempts)
            retryStrategy: (times: number) => {
                if (times > 3) {
                    console.error('[Redis] ❌ Max retry attempts (3) exceeded. Giving up.');
                    return null; // Stop retrying
                }

                const delay = Math.min(times * 1000, 3000); // 1s, 2s, 3s
                console.log(`[Redis] Retry attempt ${times}/3, waiting ${delay}ms`);
                return delay;
            },

            // SECURITY: Connection timeout (10 seconds)
            connectTimeout: 10000,

            // SECURITY: Command timeout (30 seconds)
            commandTimeout: 30000,

            // SECURITY: Fail-fast on connection errors
            reconnectOnError: (err: Error) => {
                console.error('[Redis] Reconnect on error:', err.message);

                // Only reconnect on specific recoverable errors
                const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
                if (targetErrors.some(targetError => err.message.includes(targetError))) {
                    console.log('[Redis] Attempting reconnection for recoverable error');
                    return true;
                }

                // Don't reconnect on auth failures or other critical errors
                console.error('[Redis] Not reconnecting for error:', err.message);
                return false;
            },

            // Enable ready check
            enableReadyCheck: true,

            // Connect immediately (not lazy)
            lazyConnect: false,

            // Keep-alive settings
            keepAlive: 30000, // 30 seconds

            // Family preference (IPv4)
            family: 4,
        });

        redisClient.on('connect', () => {
            console.log('[Redis] ✅ Connected successfully');
        });

        redisClient.on('ready', () => {
            console.log('[Redis] ✅ Ready to accept commands');
        });

        redisClient.on('error', (err: Error) => {
            console.error('[Redis] ❌ Connection error:', err.message);

            // Log additional context for debugging
            if (err.message.includes('ECONNREFUSED')) {
                console.error('[Redis] Redis server is not running or not accessible');
            } else if (err.message.includes('NOAUTH')) {
                console.error('[Redis] Authentication failed - check REDIS_PASSWORD');
            } else if (err.message.includes('ETIMEDOUT')) {
                console.error('[Redis] Connection timed out - check network/firewall');
            }
        });

        redisClient.on('close', () => {
            console.log('[Redis] Connection closed');
        });

        redisClient.on('reconnecting', (delay: number) => {
            console.log(`[Redis] Reconnecting in ${delay}ms...`);
        });

        redisClient.on('end', () => {
            console.log('[Redis] Connection ended (no more reconnection attempts)');
        });
    }

    return redisClient;
}

export async function closeRedisConnection(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        console.log('[Redis] Connection closed gracefully');
    }
}

export async function testRedisConnection(): Promise<boolean> {
    try {
        const redis = getRedisConnection();
        const result = await redis.ping();
        console.log('[Redis] ✅ Ping test successful:', result);
        return result === 'PONG';
    } catch (error) {
        console.error('[Redis] ❌ Ping test failed:', error);
        return false;
    }
}

// Health check for monitoring
export async function getRedisHealth(): Promise<{
    connected: boolean;
    latency?: number;
    memory?: string;
    clients?: number;
}> {
    try {
        const redis = getRedisConnection();
        const start = Date.now();
        await redis.ping();
        const latency = Date.now() - start;

        const info = await redis.info('memory');
        const clientsList = await redis.client('LIST') as string;

        return {
            connected: true,
            latency,
            memory: info.split('\n').find(l => l.startsWith('used_memory_human'))?.split(':')[1]?.trim(),
            clients: clientsList.split('\n').length - 1,
        };
    } catch (error) {
        return { connected: false };
    }
}
