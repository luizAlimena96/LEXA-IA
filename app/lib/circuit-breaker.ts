/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by opening circuit after threshold failures
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
    threshold: number;      // Number of failures before opening
    timeout: number;        // Time in ms before attempting half-open
    resetTimeout: number;   // Time in ms before resetting failure count
}

export class CircuitBreaker {
    private failures = 0;
    private state: CircuitState = 'CLOSED';
    private lastFailureTime: number = 0;
    private lastSuccessTime: number = 0;
    private nextAttemptTime: number = 0;

    constructor(
        private options: CircuitBreakerOptions = {
            threshold: 5,
            timeout: 60000,      // 1 minute
            resetTimeout: 300000 // 5 minutes
        }
    ) {}

    async execute<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
        const now = Date.now();

        // Check if circuit is OPEN
        if (this.state === 'OPEN') {
            if (now >= this.nextAttemptTime) {
                console.log('[Circuit Breaker] Attempting HALF_OPEN state');
                this.state = 'HALF_OPEN';
            } else {
                const waitTime = Math.ceil((this.nextAttemptTime - now) / 1000);
                console.warn(`[Circuit Breaker] Circuit is OPEN. Retry in ${waitTime}s`);
                
                if (fallback) {
                    return fallback();
                }
                
                throw new Error(`Circuit breaker is OPEN. Retry in ${waitTime}s`);
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess() {
        this.failures = 0;
        this.lastSuccessTime = Date.now();
        
        if (this.state === 'HALF_OPEN') {
            console.log('[Circuit Breaker] HALF_OPEN → CLOSED (success)');
            this.state = 'CLOSED';
        }
    }

    private onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();

        console.warn(`[Circuit Breaker] Failure ${this.failures}/${this.options.threshold}`);

        if (this.failures >= this.options.threshold) {
            this.state = 'OPEN';
            this.nextAttemptTime = Date.now() + this.options.timeout;
            
            console.error(`[Circuit Breaker] CLOSED/HALF_OPEN → OPEN (${this.failures} failures)`);
        }
    }

    getState(): CircuitState {
        return this.state;
    }

    getFailures(): number {
        return this.failures;
    }

    reset() {
        this.failures = 0;
        this.state = 'CLOSED';
        this.lastFailureTime = 0;
        this.lastSuccessTime = 0;
        this.nextAttemptTime = 0;
        console.log('[Circuit Breaker] Manual reset to CLOSED');
    }
}

// Global circuit breaker instance for FSM Engine
export const fsmCircuitBreaker = new CircuitBreaker({
    threshold: 5,
    timeout: 60000,      // 1 min before retry
    resetTimeout: 300000 // 5 min before full reset
});
