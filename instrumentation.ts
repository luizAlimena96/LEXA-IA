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
            // Initialize database connection monitoring
            const { startDatabaseMonitoring } = await import('./app/lib/db-monitor');
            startDatabaseMonitoring();
            logger.info('[Instrumentation] ✅ Database monitoring initialized');

            // Graceful shutdown on SIGTERM (production)
            process.on('SIGTERM', async () => {
                logger.info('[Instrumentation] SIGTERM received, shutting down gracefully...');

                const { destroyRateLimiter } = await import('./app/lib/rate-limiter');
                const { stopDatabaseMonitoring } = await import('./app/lib/db-monitor');
                const { prisma } = await import('./app/lib/prisma');

                // Stop monitoring
                stopDatabaseMonitoring();

                // Cleanup
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

                const { destroyRateLimiter } = await import('./app/lib/rate-limiter');
                const { stopDatabaseMonitoring } = await import('./app/lib/db-monitor');
                const { prisma } = await import('./app/lib/prisma');

                // Stop monitoring
                stopDatabaseMonitoring();

                // Cleanup
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
