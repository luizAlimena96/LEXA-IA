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
    mediaUrl?: string;
    mediaType?: 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'TEXT';
    caption?: string;
}

// ... Chat interface remains same ...

// ... getChats remains same ...

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
            sent: msg.fromMe,
            read: true,
            role: msg.fromMe ? 'assistant' : 'user',
            mediaUrl: msg.mediaUrl,
            mediaType: msg.mediaType || 'TEXT',
            caption: msg.caption
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
