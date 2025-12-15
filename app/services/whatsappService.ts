// WhatsApp Service - Backend integration
// Uses backend API via api-client

import api from '../lib/api-client';

export interface Message {
    id: string;
    content: string;
    time: string;
    sent: boolean;
    read?: boolean;
    role: 'user' | 'assistant';
}

export interface Chat {
    id: string;
    name: string;
    phone: string;
    lastMessage: string;
    time: string;
    unread: number;
    avatar: string;
    online: boolean;
    leadId?: string;
    aiEnabled: boolean;
    tags: { id: string; name: string; color: string }[];
}

// Get all conversations for an organization
export async function getChats(organizationId?: string): Promise<Chat[]> {
    try {
        const conversations = await api.conversations.list(
            organizationId ? { organizationId } : undefined
        );

        return conversations.map((conv: any) => ({
            id: conv.id,
            name: conv.lead?.name || conv.whatsapp || 'Desconhecido',
            phone: conv.whatsapp,
            lastMessage: conv.messages?.[0]?.content || 'Sem mensagens',
            time: conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            }) : '',
            unread: 0, // TODO: Implementar contagem de não lidas
            avatar: (conv.lead?.name || 'U').substring(0, 2).toUpperCase(),
            online: false, // TODO: Implementar status online via Evolution API
            leadId: conv.leadId,
            aiEnabled: conv.aiEnabled ?? true,
            tags: conv.tags || [],
        }));
    } catch (error) {
        console.error('Error fetching chats:', error);
        return [];
    }
}

// Get messages for a specific conversation
export async function getMessages(conversationId: string): Promise<Message[]> {
    try {
        const messages = await api.conversations.getMessages(conversationId);

        return messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            time: new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            // fromMe = true -> mensagem enviada pelo sistema/LEXA (direita, azul)
            // fromMe = false -> mensagem recebida do usuário (esquerda, branco)
            sent: msg.fromMe,
            read: true,
            role: msg.fromMe ? 'assistant' : 'user',
        }));
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}

// Send a message in a conversation
export async function sendMessage(conversationId: string, text: string): Promise<Message> {
    try {
        const message = await api.conversations.sendMessage(conversationId, {
            content: text,
            role: 'assistant',
        });

        return {
            id: message.id,
            content: message.content,
            time: new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            sent: true,
            read: false,
            role: 'assistant',
        };
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

// Create a new conversation
export async function createConversation(
    whatsapp: string,
    organizationId: string,
    agentId: string
): Promise<Chat> {
    try {
        const conversation = await api.conversations.create({
            whatsapp,
            organizationId,
            agentId,
        });

        return {
            id: conversation.id,
            name: conversation.lead?.name || whatsapp,
            phone: whatsapp,
            lastMessage: '',
            time: new Date().toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            unread: 0,
            avatar: 'U',
            online: false,
            leadId: conversation.leadId,
            aiEnabled: true,
            tags: [],
        };
    } catch (error) {
        console.error('Error creating conversation:', error);
        throw error;
    }
}

// Send media (image, video, document, audio) in a conversation
export async function sendMediaMessage(
    conversationId: string,
    file: File,
    mediaType: 'image' | 'video' | 'document' | 'audio',
    caption?: string
): Promise<Message> {
    // TODO: Implement media upload via backend
    // For now, return a placeholder
    console.warn('Media upload not yet implemented in backend');

    return {
        id: crypto.randomUUID(),
        content: caption || `[${mediaType.toUpperCase()} enviado: ${file.name}]`,
        time: new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        }),
        sent: true,
        read: false,
        role: 'assistant',
    };
}
