// Event Emitter for Server-Sent Events
// Manages SSE connections and broadcasts events to connected clients

type EventCallback = (data: any) => void;

class MessageEventEmitter {
    private clients: Map<string, Set<EventCallback>>;

    constructor() {
        this.clients = new Map();
    }

    /**
     * Add a client listener for a specific conversation
     */
    addClient(conversationId: string, callback: EventCallback): void {
        if (!this.clients.has(conversationId)) {
            this.clients.set(conversationId, new Set());
        }
        this.clients.get(conversationId)!.add(callback);
        console.log(`[SSE] Client connected to conversation: ${conversationId}`);
    }

    /**
     * Remove a client listener
     */
    removeClient(conversationId: string, callback: EventCallback): void {
        const callbacks = this.clients.get(conversationId);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.clients.delete(conversationId);
            }
            console.log(`[SSE] Client disconnected from conversation: ${conversationId}`);
        }
    }

    /**
     * Emit an event to all clients listening to a conversation
     */
    emit(conversationId: string, data: any): void {
        const callbacks = this.clients.get(conversationId);
        if (callbacks && callbacks.size > 0) {
            console.log(`[SSE] Broadcasting to ${callbacks.size} client(s) for conversation: ${conversationId}`);
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('[SSE] Error calling client callback:', error);
                }
            });
        }
    }

    /**
     * Get number of connected clients for a conversation
     */
    getClientCount(conversationId: string): number {
        return this.clients.get(conversationId)?.size || 0;
    }

    /**
     * Get total number of connected clients
     */
    getTotalClients(): number {
        let total = 0;
        this.clients.forEach(callbacks => {
            total += callbacks.size;
        });
        return total;
    }
}

// Singleton instance
export const messageEventEmitter = new MessageEventEmitter();
