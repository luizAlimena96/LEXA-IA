import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// GET /api/conversations/[id] - Get a single conversation
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authentication handled by backend
        const { id } = await params;

        const conversation = await prisma.conversation.findUnique({
            where: { id },
            include: {
                lead: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
                messages: {
                    orderBy: { timestamp: 'desc' },
                    take: 50,
                },
                agent: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                tags: true,
            },
        });

        if (!conversation) {
            throw new ValidationError('Conversation not found');
        }

        // Check permissions
        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== conversation.organizationId) {
            throw new ValidationError('No permission to access this conversation');
        }

        return NextResponse.json(conversation);
    } catch (error) {
        return handleError(error);
    }
}

// PATCH /api/conversations/[id] - Update a conversation (e.g., toggle AI)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authentication handled by backend
        const { id } = await params;
        const body = await request.json();

        // Find the conversation first
        const conversation = await prisma.conversation.findUnique({
            where: { id },
            select: {
                id: true,
                organizationId: true,
            },
        });

        if (!conversation) {
            throw new ValidationError('Conversation not found');
        }

        // Check permissions
        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== conversation.organizationId) {
            throw new ValidationError('No permission to update this conversation');
        }

        // Build update data - only allow certain fields to be updated
        const updateData: { aiEnabled?: boolean } = {};

        if (typeof body.aiEnabled === 'boolean') {
            updateData.aiEnabled = body.aiEnabled;
        }

        // Perform the update
        const updatedConversation = await prisma.conversation.update({
            where: { id },
            data: updateData,
            include: {
                lead: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
                tags: true,
            },
        });

        return NextResponse.json(updatedConversation);
    } catch (error) {
        return handleError(error);
    }
}

// DELETE /api/conversations/[id] - Delete a conversation
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authentication handled by backend
        const { id } = await params;

        // Find the conversation first
        const conversation = await prisma.conversation.findUnique({
            where: { id },
            select: {
                id: true,
                organizationId: true,
            },
        });

        if (!conversation) {
            throw new ValidationError('Conversation not found');
        }

        // Check permissions
        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== conversation.organizationId) {
            throw new ValidationError('No permission to delete this conversation');
        }

        await prisma.conversation.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
