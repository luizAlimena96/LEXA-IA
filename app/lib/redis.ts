// Redis Connection Configuration
// Singleton pattern to ensure only one Redis connection

import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisConnection(): Redis {
    if (!redisClient) {
        const redisHost = process.env.REDIS_HOST || 'localhost';
        const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
        const redisPassword = process.env.REDIS_PASSWORD || undefined;
        const redisDb = parseInt(process.env.REDIS_DB || '0', 10);

        console.log('[Redis] Connecting to Redis...', {
            host: redisHost,
            port: redisPort,
            db: redisDb,
        });

        redisClient = new Redis({
            host: redisHost,
            port: redisPort,
            password: redisPassword,
            db: redisDb,
            maxRetriesPerRequest: null, // Required by BullMQ
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                console.log(`[Redis] Retry attempt ${times}, waiting ${delay}ms`);
                return delay;
            },
            reconnectOnError: (err: Error) => {
                console.error('[Redis] Reconnect on error:', err.message);
                return true;
            },
        });

        redisClient.on('connect', () => {
            console.log('[Redis] ✅ Connected successfully');
        });

        redisClient.on('error', (err: Error) => {
            console.error('[Redis] ❌ Connection error:', err.message);
        });

        redisClient.on('close', () => {
            console.log('[Redis] Connection closed');
        });

        redisClient.on('reconnecting', () => {
            console.log('[Redis] Reconnecting...');
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
        console.log('[Redis] Ping test:', result);
        return result === 'PONG';
    } catch (error) {
        console.error('[Redis] Ping test failed:', error);
        return false;
    }
}
