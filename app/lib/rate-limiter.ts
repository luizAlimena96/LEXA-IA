/**
 * Rate Limiter
 * Prevents excessive requests from overwhelming the system
 */

interface RateLimitRecord {
    count: number;
    resetAt: number;
}

class RateLimiter {
    private records = new Map<string, RateLimitRecord>();
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Cleanup expired records every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
    }

    /**
     * Check if request is within rate limit
     * @param key - Unique identifier (e.g., leadId, userId)
     * @param maxRequests - Maximum requests allowed
     * @param windowMs - Time window in milliseconds
     * @returns true if allowed, false if rate limited
     */
    checkLimit(key: string, maxRequests: number, windowMs: number): boolean {
        const now = Date.now();
        const record = this.records.get(key);

        // No record or expired - allow and create new
        if (!record || now > record.resetAt) {
            this.records.set(key, {
                count: 1,
                resetAt: now + windowMs
            });
            return true;
        }

        // Within limit - increment and allow
        if (record.count < maxRequests) {
            record.count++;
            return true;
        }

        // Rate limited
        return false;
    }

    /**
     * Get remaining requests for a key
     */
    getRemaining(key: string, maxRequests: number): number {
        const record = this.records.get(key);
        if (!record || Date.now() > record.resetAt) {
            return maxRequests;
        }
        return Math.max(0, maxRequests - record.count);
    }

    /**
     * Get time until reset in seconds
     */
    getResetTime(key: string): number {
        const record = this.records.get(key);
        if (!record) return 0;
        
        const now = Date.now();
        if (now > record.resetAt) return 0;
        
        return Math.ceil((record.resetAt - now) / 1000);
    }

    /**
     * Reset limit for a specific key
     */
    reset(key: string) {
        this.records.delete(key);
    }

    /**
     * Cleanup expired records
     */
    private cleanup() {
        const now = Date.now();
        for (const [key, record] of this.records.entries()) {
            if (now > record.resetAt) {
                this.records.delete(key);
            }
        }
    }

    /**
     * Destroy rate limiter and cleanup interval
     */
    destroy() {
        clearInterval(this.cleanupInterval);
        this.records.clear();
    }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Rate limit configurations
export const RATE_LIMITS = {
    FSM_TRANSITIONS_PER_MINUTE: 10,
    AI_CALLS_PER_MINUTE: 30,
    WINDOW_MS: 60000, // 1 minute
} as const;

/**
 * Helper function to check FSM transition rate limit
 */
export function checkFSMRateLimit(leadId: string): boolean {
    return rateLimiter.checkLimit(
        `fsm:${leadId}`,
        RATE_LIMITS.FSM_TRANSITIONS_PER_MINUTE,
        RATE_LIMITS.WINDOW_MS
    );
}

/**
 * Helper function to check AI call rate limit
 */
export function checkAIRateLimit(leadId: string): boolean {
    return rateLimiter.checkLimit(
        `ai:${leadId}`,
        RATE_LIMITS.AI_CALLS_PER_MINUTE,
        RATE_LIMITS.WINDOW_MS
    );
}
