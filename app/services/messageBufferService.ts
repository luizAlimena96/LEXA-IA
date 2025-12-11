// Message Buffer Service
// Manages a buffer of incoming messages to be processed together after a delay
// This humanizes AI responses by waiting for the user to finish sending messages

import { getRedisConnection, testRedisConnection } from '@/app/lib/redis';

export interface BufferedMessage {
    content: string;
    type: 'TEXT' | 'AUDIO' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
    timestamp: number;
    messageId: string;
    audioTranscription?: string;
    imageAnalysis?: string;
    documentContent?: string;
}

interface BufferData {
    messages: BufferedMessage[];
    lastUpdated: number;
    processingScheduled: boolean;
}

const BUFFER_PREFIX = 'msg_buffer:';
const TIMER_PREFIX = 'msg_timer:';

// In-memory timer tracking (for cancellation)
const activeTimers: Map<string, NodeJS.Timeout> = new Map();

/**
 * Add a message to the buffer for a given phone number
 */
export async function addToBuffer(phone: string, message: BufferedMessage): Promise<void> {
    try {
        const redis = getRedisConnection();
        const key = `${BUFFER_PREFIX}${phone}`;

        // Get existing buffer or create new
        const existingData = await redis.get(key);
        let buffer: BufferData;

        if (existingData) {
            buffer = JSON.parse(existingData);
        } else {
            buffer = {
                messages: [],
                lastUpdated: Date.now(),
                processingScheduled: false,
            };
        }

        // Add new message
        buffer.messages.push(message);
        buffer.lastUpdated = Date.now();

        // Save buffer (expires after 5 minutes as safety)
        await redis.setex(key, 300, JSON.stringify(buffer));

        console.log(`[Buffer] Added message to buffer for ${phone}. Total: ${buffer.messages.length}`);
    } catch (error) {
        console.error('[Buffer] Error adding to buffer:', error);
        throw error;
    }
}

/**
 * Get all buffered messages for a phone number
 */
export async function getBuffer(phone: string): Promise<BufferedMessage[]> {
    try {
        const redis = getRedisConnection();
        const key = `${BUFFER_PREFIX}${phone}`;

        const data = await redis.get(key);
        if (!data) {
            return [];
        }

        const buffer: BufferData = JSON.parse(data);
        return buffer.messages;
    } catch (error) {
        console.error('[Buffer] Error getting buffer:', error);
        return [];
    }
}

/**
 * Clear the buffer for a phone number
 */
export async function clearBuffer(phone: string): Promise<void> {
    try {
        const redis = getRedisConnection();
        const key = `${BUFFER_PREFIX}${phone}`;

        await redis.del(key);

        // Also clear any active timer
        cancelScheduledProcessing(phone);

        console.log(`[Buffer] Cleared buffer for ${phone}`);
    } catch (error) {
        console.error('[Buffer] Error clearing buffer:', error);
    }
}

/**
 * Check if there's an active buffer for a phone number
 */
export async function hasActiveBuffer(phone: string): Promise<boolean> {
    try {
        const redis = getRedisConnection();
        const key = `${BUFFER_PREFIX}${phone}`;

        const exists = await redis.exists(key);
        return exists === 1;
    } catch (error) {
        console.error('[Buffer] Error checking buffer:', error);
        return false;
    }
}

/**
 * Get the count of messages in the buffer
 */
export async function getBufferCount(phone: string): Promise<number> {
    const messages = await getBuffer(phone);
    return messages.length;
}

/**
 * Cancel any scheduled processing for a phone number
 */
export function cancelScheduledProcessing(phone: string): void {
    const existingTimer = activeTimers.get(phone);
    if (existingTimer) {
        clearTimeout(existingTimer);
        activeTimers.delete(phone);
        console.log(`[Buffer] Cancelled timer for ${phone}`);
    }
}

/**
 * Schedule processing of the buffer after a delay
 * If called again before the delay expires, it resets the timer
 * Processes ALL messages in buffer when timer expires (no message limit)
 */
export async function scheduleProcessing(
    phone: string,
    delayMs: number,
    callback: (messages: BufferedMessage[]) => Promise<void>
): Promise<void> {
    // Cancel any existing timer for this phone
    cancelScheduledProcessing(phone);

    // Schedule new processing
    const timer = setTimeout(async () => {
        activeTimers.delete(phone);

        try {
            const messages = await getBuffer(phone);
            if (messages.length > 0) {
                console.log(`[Buffer] Processing ${messages.length} buffered messages for ${phone}`);
                await clearBuffer(phone);
                await callback(messages);
            }
        } catch (error) {
            console.error(`[Buffer] Error processing buffer for ${phone}:`, error);
        }
    }, delayMs);

    activeTimers.set(phone, timer);
    console.log(`[Buffer] Scheduled processing for ${phone} in ${delayMs}ms`);
}

/**
 * Combine buffered messages into a single content string
 */
export function combineMessages(messages: BufferedMessage[]): string {
    return messages
        .map(msg => {
            // If it has special content (transcription, analysis), use that
            if (msg.audioTranscription) {
                return `[Áudio do cliente]: ${msg.audioTranscription}`;
            }
            if (msg.imageAnalysis) {
                return `[Imagem do cliente]: ${msg.imageAnalysis}`;
            }
            if (msg.documentContent) {
                return `[Documento do cliente]: ${msg.documentContent}`;
            }
            return msg.content;
        })
        .join('\n');
}

/**
 * Check if Redis is available for buffering
 */
export async function isBufferingAvailable(): Promise<boolean> {
    try {
        return await testRedisConnection();
    } catch {
        return false;
    }
}
