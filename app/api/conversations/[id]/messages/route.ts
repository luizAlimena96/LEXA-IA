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

            if (evolutionApiUrl && evolutionApiKey && evolutionInstanceName) {
                try {
                    await fetch(`${evolutionApiUrl}/message/sendText/${evolutionInstanceName}`, {
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
                } catch (error) {
                    console.error('Error sending message via Evolution:', error);
                    // Don't throw error - message was saved, Evolution send failed
                }
            }
        }

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
