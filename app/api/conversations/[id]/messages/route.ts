import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// GET /api/conversations/[id]/messages - Get messages for a conversation
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id: conversationId } = await params;

        // Verify conversation belongs to user's organization
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { organizationId: true },
        });

        if (!conversation) {
            throw new ValidationError('Conversation not found');
        }

        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== conversation.organizationId) {
            throw new ValidationError('No permission');
        }

        const messages = await prisma.message.findMany({
            where: {
                conversationId,
            },
            orderBy: {
                timestamp: 'asc',
            },
        });

        return NextResponse.json(messages);
    } catch (error) {
        return handleError(error);
    }
}

// POST /api/conversations/[id]/messages - Send a message
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id: conversationId } = await params;
        const body = await request.json();
        const { content, role } = body;

        if (!content || !role) {
            throw new ValidationError('Content and role are required');
        }

        // Verify conversation belongs to user's organization
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: {
                organizationId: true,
                whatsapp: true,
                organization: {
                    select: {
                        evolutionApiUrl: true,
                        evolutionApiKey: true,
                        evolutionInstanceName: true,
                    }
                }
            },
        });

        if (!conversation) {
            throw new ValidationError('Conversation not found');
        }

        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== conversation.organizationId) {
            throw new ValidationError('No permission');
        }

        const message = await prisma.message.create({
            data: {
                conversationId,
                content,
                fromMe: role === 'assistant',
                type: 'TEXT',
                messageId: crypto.randomUUID(),
            },
        });

        // Update conversation updatedAt
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        // Send message via Evolution API if it's from assistant
        if (role === 'assistant' && conversation.organization?.evolutionApiUrl) {
            const { evolutionApiUrl, evolutionApiKey, evolutionInstanceName } = conversation.organization;

            // Validate Evolution API configuration
            if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstanceName) {
                console.error('❌ Evolution API configuration incomplete:', {
                    hasUrl: !!evolutionApiUrl,
                    hasKey: !!evolutionApiKey,
                    hasInstance: !!evolutionInstanceName,
                });
                throw new ValidationError(
                    'Evolution API não configurada. Configure URL, API Key e Nome da Instância na página de Clientes.'
                );
            }

            try {
                const evolutionUrl = `${evolutionApiUrl}/message/sendText/${evolutionInstanceName}`;
                console.log('📤 Sending message via Evolution API:', {
                    url: evolutionUrl,
                    instance: evolutionInstanceName,
                    to: conversation.whatsapp,
                    contentLength: content.length,
                });

                const response = await fetch(evolutionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': evolutionApiKey,
                    },
                    body: JSON.stringify({
                        number: conversation.whatsapp,
                        text: content,
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Evolution API error:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorText,
                        url: evolutionUrl,
                    });
                    throw new Error(
                        `Erro ao enviar via WhatsApp (${response.status}): ${response.statusText}`
                    );
                }

                const responseData = await response.json();
                console.log('✅ Message sent via Evolution API:', responseData);
            } catch (error: any) {
                console.error('❌ Error sending message via Evolution:', {
                    error: error.message,
                    stack: error.stack,
                });

                // Throw error to prevent message from being saved as "sent"
                throw new Error(
                    error.message || 'Erro ao enviar mensagem via WhatsApp. Verifique a configuração da Evolution API.'
                );
            }
        }

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
