/**
 * Timeout Protection Utility
 * 
 * Prevents runaway processes from consuming excessive CPU
 * by enforcing maximum execution time limits
 */

/**
 * Wraps a promise with a timeout
 * If the promise doesn't resolve within the timeout, it will be rejected
 * 
 * @param promise - The promise to wrap
 * @param timeoutMs - Maximum time to wait in milliseconds
 * @param errorMessage - Custom error message for timeout
 * @returns Promise that resolves with the original promise or rejects on timeout
 */
export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string = 'Operation timed out'
): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
        )
    ]);
}

/**
 * Delays execution for a specified time
 * Useful for implementing backoff strategies
 * 
 * @param ms - Milliseconds to delay
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculates exponential backoff delay
 * 
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelayMs - Base delay in milliseconds (default: 1000)
 * @param maxDelayMs - Maximum delay in milliseconds (default: 30000)
 * @returns Delay in milliseconds
 */
export function calculateBackoff(
    attempt: number,
    baseDelayMs: number = 1000,
    maxDelayMs: number = 30000
): number {
    const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
    return delay;
}
