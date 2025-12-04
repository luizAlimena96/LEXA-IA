/**
 * Message Buffer Service
 * 
 * Sistema de buffer para agrupar mensagens e evitar processamento simultâneo
 */

import { BufferConfig, MessageQueueItem } from './types';

// Mapa de filas por conversationId
const messageQueues = new Map<string, MessageQueueItem[]>();

// Mapa de timers por conversationId
const processingTimers = new Map<string, NodeJS.Timeout>();

/**
 * Adiciona uma mensagem ao buffer
 */
export function addMessageToBuffer(
    conversationId: string,
    messageId: string,
    agentId: string,
    message: string,
    bufferConfig: BufferConfig,
    onProcess: (messages: MessageQueueItem[]) => Promise<void>
): void {
    // Se buffer está desabilitado, processar imediatamente
    if (!bufferConfig.enabled) {
        const item: MessageQueueItem = {
            messageId,
            conversationId,
            agentId,
            message,
            receivedAt: new Date(),
            scheduledFor: new Date(),
            status: 'pending',
        };

        onProcess([item]).catch(error => {
            console.error('[Message Buffer] Error processing immediate message:', error);
        });

        return;
    }

    // Criar item da fila
    const queueItem: MessageQueueItem = {
        messageId,
        conversationId,
        agentId,
        message,
        receivedAt: new Date(),
        scheduledFor: new Date(Date.now() + bufferConfig.delayMs),
        status: 'pending',
    };

    // Adicionar à fila
    const queue = messageQueues.get(conversationId) || [];
    queue.push(queueItem);
    messageQueues.set(conversationId, queue);

    console.log(`[Message Buffer] Added message to buffer for conversation ${conversationId}`, {
        queueSize: queue.length,
        delayMs: bufferConfig.delayMs,
        scheduledFor: queueItem.scheduledFor,
    });

    // Cancelar timer anterior se existir
    const existingTimer = processingTimers.get(conversationId);
    if (existingTimer) {
        clearTimeout(existingTimer);
    }

    // Criar novo timer para processar após o delay
    const timer = setTimeout(async () => {
        await processQueue(conversationId, onProcess);
    }, bufferConfig.delayMs);

    processingTimers.set(conversationId, timer);
}

/**
 * Processa a fila de mensagens de uma conversa
 */
async function processQueue(
    conversationId: string,
    onProcess: (messages: MessageQueueItem[]) => Promise<void>
): Promise<void> {
    const queue = messageQueues.get(conversationId);

    if (!queue || queue.length === 0) {
        return;
    }

    console.log(`[Message Buffer] Processing queue for conversation ${conversationId}`, {
        messageCount: queue.length,
    });

    // Marcar todas como processando
    queue.forEach(item => {
        item.status = 'processing';
    });

    try {
        // Processar todas as mensagens da fila
        await onProcess(queue);

        // Marcar como completadas
        queue.forEach(item => {
            item.status = 'completed';
        });

        console.log(`[Message Buffer] Successfully processed ${queue.length} messages`);
    } catch (error) {
        console.error('[Message Buffer] Error processing queue:', error);

        // Marcar como falhadas
        queue.forEach(item => {
            item.status = 'failed';
        });
    } finally {
        // Limpar fila e timer
        messageQueues.delete(conversationId);
        processingTimers.delete(conversationId);
    }
}

/**
 * Limpa o buffer de uma conversa específica
 */
export function clearBuffer(conversationId: string): void {
    const timer = processingTimers.get(conversationId);
    if (timer) {
        clearTimeout(timer);
        processingTimers.delete(conversationId);
    }

    messageQueues.delete(conversationId);

    console.log(`[Message Buffer] Cleared buffer for conversation ${conversationId}`);
}

/**
 * Obtém o status do buffer de uma conversa
 */
export function getBufferStatus(conversationId: string): {
    queueSize: number;
    messages: MessageQueueItem[];
    hasTimer: boolean;
} {
    const queue = messageQueues.get(conversationId) || [];
    const hasTimer = processingTimers.has(conversationId);

    return {
        queueSize: queue.length,
        messages: queue,
        hasTimer,
    };
}

/**
 * Processa imediatamente o buffer (força processamento)
 */
export async function flushBuffer(
    conversationId: string,
    onProcess: (messages: MessageQueueItem[]) => Promise<void>
): Promise<void> {
    // Cancelar timer se existir
    const timer = processingTimers.get(conversationId);
    if (timer) {
        clearTimeout(timer);
        processingTimers.delete(conversationId);
    }

    // Processar fila imediatamente
    await processQueue(conversationId, onProcess);
}

/**
 * Limpa todos os buffers (útil para shutdown)
 */
export function clearAllBuffers(): void {
    // Cancelar todos os timers
    processingTimers.forEach(timer => clearTimeout(timer));
    processingTimers.clear();

    // Limpar todas as filas
    messageQueues.clear();

    console.log('[Message Buffer] Cleared all buffers');
}

/**
 * Obtém estatísticas globais do buffer
 */
export function getBufferStats(): {
    totalConversations: number;
    totalQueuedMessages: number;
    activeTimers: number;
} {
    let totalMessages = 0;
    messageQueues.forEach(queue => {
        totalMessages += queue.length;
    });

    return {
        totalConversations: messageQueues.size,
        totalQueuedMessages: totalMessages,
        activeTimers: processingTimers.size,
    };
}
