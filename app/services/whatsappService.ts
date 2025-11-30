// WhatsApp Service - Real database integration
// Uses Conversation and Message models from Prisma

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
}

// Get all conversations for an organization
export async function getChats(organizationId?: string): Promise<Chat[]> {
    try {
        const url = organizationId
            ? `/api/conversations?organizationId=${organizationId}`
            : '/api/conversations';

        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch chats');
        }

        const conversations = await response.json();

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
        }));
    } catch (error) {
        console.error('Error fetching chats:', error);
        return [];
    }
}

// Get messages for a specific conversation
export async function getMessages(conversationId: string): Promise<Message[]> {
    try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch messages');
        }

        const messages = await response.json();

        return messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            time: new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            sent: msg.role === 'assistant',
            read: true,
            role: msg.role,
        }));
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}

// Send a message in a conversation
export async function sendMessage(conversationId: string, text: string): Promise<Message> {
    try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                content: text,
                role: 'assistant',
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        const message = await response.json();

        return {
            id: message.id,
            content: message.content,
            time: new Date(message.createdAt).toLocaleTimeString('pt-BR', {
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
        const response = await fetch('/api/conversations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                whatsapp,
                organizationId,
                agentId,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create conversation');
        }

        const conversation = await response.json();

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
        };
    } catch (error) {
        console.error('Error creating conversation:', error);
        throw error;
    }
}
