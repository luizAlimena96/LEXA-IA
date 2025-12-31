/**
 * Next.js Instrumentation
 * This file is automatically loaded by Next.js when the server starts
 * Perfect for initializing queue system and other server-side tasks
 */

// import { logger } from './app/lib/conditional-logger';

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Only run on Node.js runtime (not Edge)
        // console.log('[Instrumentation] Initializing server-side tasks...');
        // Database monitoring and other backend tasks have been removed from frontend
    }
}
