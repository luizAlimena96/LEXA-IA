import { EventEmitter } from 'events';

class MessageEventEmitter extends EventEmitter {
    private static instance: MessageEventEmitter;
    private clients: Map<string, Set<(data: any) => void>>;

    private constructor() {
        super();
        this.clients = new Map();
        this.setMaxListeners(1000);
    }

    public static getInstance(): MessageEventEmitter {
        if (!MessageEventEmitter.instance) {
            MessageEventEmitter.instance = new MessageEventEmitter();
        }
        return MessageEventEmitter.instance;
    }

    public addClient(conversationId: string, callback: (data: any) => void) {
        if (!this.clients.has(conversationId)) {
            this.clients.set(conversationId, new Set());
        }
        this.clients.get(conversationId)?.add(callback);
    }

    public removeClient(conversationId: string, callback: (data: any) => void) {
        const conversationClients = this.clients.get(conversationId);
        if (conversationClients) {
            conversationClients.delete(callback);
            if (conversationClients.size === 0) {
                this.clients.delete(conversationId);
            }
        }
    }

    public emitMessage(conversationId: string, message: any) {
        const conversationClients = this.clients.get(conversationId);
        if (conversationClients) {
            conversationClients.forEach(callback => {
                try {
                    callback(message);
                } catch (error) {
                    console.error('Error emitting message to client:', error);
                }
            });
        }
    }
}

export const messageEventEmitter = MessageEventEmitter.getInstance();
