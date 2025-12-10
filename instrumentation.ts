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
                console.error('[Instrumentation] Please ensure Redis is running: sudo systemctl start redis-server');
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

            // Graceful shutdown
            process.on('SIGTERM', async () => {
                console.log('[Instrumentation] SIGTERM received, shutting down gracefully...');

                const { closeAllWorkers } = await import('./app/lib/queues/workers');
                const { closeAllQueues } = await import('./app/lib/queues');
                const { closeRedisConnection } = await import('./app/lib/redis');

                await closeAllWorkers();
                await closeAllQueues();
                await closeRedisConnection();

                console.log('[Instrumentation] ✅ Graceful shutdown complete');
                process.exit(0);
            });

        } catch (error) {
            console.error('[Instrumentation] ❌ Error initializing queue system:', error);
            console.error('[Instrumentation] Falling back to cron jobs...');

            // Fallback to old cron system if queue system fails
            await import('./app/lib/cron');
        }
    }
}
