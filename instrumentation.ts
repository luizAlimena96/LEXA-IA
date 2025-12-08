/**
 * Next.js Instrumentation
 * This file is automatically loaded by Next.js when the server starts
 * Perfect for initializing cron jobs and other server-side tasks
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Only run on Node.js runtime (not Edge)
        console.log('[Instrumentation] Initializing server-side tasks...');

        // Import and initialize cron jobs
        await import('./app/lib/cron');

        console.log('[Instrumentation] Cron jobs initialized successfully');
    }
}
