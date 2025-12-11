/**
 * Next.js Instrumentation
 * This file is automatically loaded by Next.js when the server starts
 * Perfect for initializing queue system and other server-side tasks
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Only run on Node.js runtime (not Edge)
        console.log('[Instrumentation] Initializing server-side tasks...');

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

            console.log('[Instrumentation] ✅ Redis connection successful');

            // Initialize queues
            const { initializeQueues } = await import('./app/lib/queues');
            initializeQueues();

            // Initialize workers
            const { initializeWorkers } = await import('./app/lib/queues/workers');
            initializeWorkers();

            // Schedule repeatable jobs
            const { scheduleJobs } = await import('./app/lib/queues/scheduler');
            await scheduleJobs();

            console.log('[Instrumentation] ✅ Queue system initialized successfully');

            // Graceful shutdown on SIGTERM (production)
            process.on('SIGTERM', async () => {
                console.log('[Instrumentation] SIGTERM received, shutting down gracefully...');

                const { closeAllWorkers } = await import('./app/lib/queues/workers');
                const { closeAllQueues } = await import('./app/lib/queues');
                const { closeRedisConnection } = await import('./app/lib/redis');
                const { destroyRateLimiter } = await import('./app/lib/rate-limiter');

                await closeAllWorkers();
                await closeAllQueues();
                await closeRedisConnection();
                destroyRateLimiter();

                console.log('[Instrumentation] ✅ Graceful shutdown complete');
                process.exit(0);
            });

            // Graceful shutdown on SIGINT (Ctrl+C in development)
            process.on('SIGINT', async () => {
                console.log('[Instrumentation] SIGINT received, shutting down gracefully...');

                const { closeAllWorkers } = await import('./app/lib/queues/workers');
                const { closeAllQueues } = await import('./app/lib/queues');
                const { closeRedisConnection } = await import('./app/lib/redis');
                const { destroyRateLimiter } = await import('./app/lib/rate-limiter');

                await closeAllWorkers();
                await closeAllQueues();
                await closeRedisConnection();
                destroyRateLimiter();

                console.log('[Instrumentation] ✅ Graceful shutdown complete');
                process.exit(0);
            });

        } catch (error) {
            console.error('[Instrumentation] ❌ Error initializing queue system:', error);
            console.error('[Instrumentation] ⚠️  Job scheduling disabled due to error');
            console.error('[Instrumentation] The application will continue running but scheduled jobs will not execute');
        }
    }
}
