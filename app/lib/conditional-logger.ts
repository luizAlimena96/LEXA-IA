/**
 * Production-Ready Logger
 * Conditional logging based on environment
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = {
    /**
     * Info logs - only in development
     */
    info: (...args: any[]) => {
        if (isDevelopment) {
            console.log('[INFO]', ...args);
        }
    },

    /**
     * Debug logs - only in development
     */
    debug: (...args: any[]) => {
        if (isDevelopment) {
            console.log('[DEBUG]', ...args);
        }
    },

    /**
     * Warning logs - always logged
     */
    warn: (...args: any[]) => {
        console.warn('[WARN]', ...args);
    },

    /**
     * Error logs - always logged
     */
    error: (...args: any[]) => {
        console.error('[ERROR]', ...args);
    },

    /**
     * Critical errors - always logged with timestamp
     */
    critical: (...args: any[]) => {
        console.error('[CRITICAL]', new Date().toISOString(), ...args);
    },

    /**
     * Success logs - only in development
     */
    success: (...args: any[]) => {
        if (isDevelopment) {
            console.log('[SUCCESS] ✅', ...args);
        }
    }
};

/**
 * Structured logging for production (JSON format)
 */
export function logStructured(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    metadata?: Record<string, any>
) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...metadata
    };

    if (process.env.NODE_ENV === 'production') {
        // JSON format for log aggregation tools
        console.log(JSON.stringify(logEntry));
    } else {
        // Human-readable format for development
        const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
        logFn(`[${level.toUpperCase()}]`, message, metadata || '');
    }
}
