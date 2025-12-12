/**
 * Next.js Instrumentation
 * This file is automatically loaded by Next.js when the server starts
 * Perfect for initializing queue system and other server-side tasks
 */

import { logger } from './app/lib/conditional-logger';

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Only run on Node.js runtime (not Edge)
        logger.info('[Instrumentation] Initializing server-side tasks...');


        try {
            // Test Redis connection
            const { testRedisConnection } = await import('./app/lib/redis');
            const redisConnected = await testRedisConnection();

            if (!redisConnected) {
                console.error('[Instrumentation] ❌ Redis connection failed. Queue system will not start.');
                console.error('[Instrumentation] ⚠️  SKIPPING job scheduling - Redis is required for queue system');
                console.error('[Instrumentation] Please ensure Redis is running: sudo systemctl start redis-server');
                console.error('[Instrumentation] Or on Windows with WSL: sudo service redis-server start');
                return;
            }

            logger.info('[Instrumentation] ✅ Redis connection successful');

            // Initialize queues
            const { initializeQueues } = await import('./app/lib/queues');
            initializeQueues();

            // Initialize workers
            const { initializeWorkers } = await import('./app/lib/queues/workers');
            initializeWorkers();

            // Schedule repeatable jobs
            const { scheduleJobs } = await import('./app/lib/queues/scheduler');
            await scheduleJobs();

            logger.info('[Instrumentation] ✅ Queue system initialized successfully');

            // Initialize message buffer cleanup to prevent memory leaks
            const { startTimerCleanup } = await import('./app/services/messageBufferService');
            startTimerCleanup();
            logger.info('[Instrumentation] ✅ Message buffer cleanup initialized');

            // Initialize database connection monitoring
            const { startDatabaseMonitoring } = await import('./app/lib/db-monitor');
            startDatabaseMonitoring();
            logger.info('[Instrumentation] ✅ Database monitoring initialized');

            // Graceful shutdown on SIGTERM (production)
            process.on('SIGTERM', async () => {
                logger.info('[Instrumentation] SIGTERM received, shutting down gracefully...');

                const { closeAllWorkers } = await import('./app/lib/queues/workers');
                const { closeAllQueues } = await import('./app/lib/queues');
                const { closeRedisConnection } = await import('./app/lib/redis');
                const { destroyRateLimiter } = await import('./app/lib/rate-limiter');
                const { stopDatabaseMonitoring } = await import('./app/lib/db-monitor');
                const { prisma } = await import('./app/lib/prisma');

                // Stop monitoring first
                stopDatabaseMonitoring();

                // Close workers and queues
                await closeAllWorkers();
                await closeAllQueues();
                await closeRedisConnection();
                destroyRateLimiter();

                // Disconnect Prisma
                await prisma.$disconnect();
                logger.info('[Instrumentation] ✅ Prisma disconnected');

                logger.info('[Instrumentation] ✅ Graceful shutdown complete');
                process.exit(0);
            });

            // Graceful shutdown on SIGINT (Ctrl+C in development)
            process.on('SIGINT', async () => {
                logger.info('[Instrumentation] SIGINT received, shutting down gracefully...');

                const { closeAllWorkers } = await import('./app/lib/queues/workers');
                const { closeAllQueues } = await import('./app/lib/queues');
                const { closeRedisConnection } = await import('./app/lib/redis');
                const { destroyRateLimiter } = await import('./app/lib/rate-limiter');
                const { stopDatabaseMonitoring } = await import('./app/lib/db-monitor');
                const { prisma } = await import('./app/lib/prisma');

                // Stop monitoring first
                stopDatabaseMonitoring();

                // Close workers and queues
                await closeAllWorkers();
                await closeAllQueues();
                await closeRedisConnection();
                destroyRateLimiter();

                // Disconnect Prisma
                await prisma.$disconnect();
                logger.info('[Instrumentation] ✅ Prisma disconnected');

                logger.info('[Instrumentation] ✅ Graceful shutdown complete');
                process.exit(0);
            });

        } catch (error) {
            console.error('[Instrumentation] ❌ Error initializing queue system:', error);
            console.error('[Instrumentation] ⚠️  Job scheduling disabled due to error');
            console.error('[Instrumentation] The application will continue running but scheduled jobs will not execute');
        }
    }
}
