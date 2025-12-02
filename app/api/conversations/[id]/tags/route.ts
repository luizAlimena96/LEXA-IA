import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, canAccessOrganization } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError, NotFoundError } from '@/app/lib/errors';

// POST /api/conversations/[id]/tags - Add tag to conversation
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id: conversationId } = await params;
        const body = await request.json();
        const { tagId } = body;

        if (!tagId) {
            throw new ValidationError('Tag ID é obrigatório');
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { organization: true }
        });

        if (!conversation) {
            throw new NotFoundError('Conversa não encontrada');
        }

        if (!canAccessOrganization(user, conversation.organizationId)) {
            throw new ValidationError('Sem permissão');
        }

        // Connect tag
        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                tags: {
                    connect: { id: tagId }
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}

// DELETE /api/conversations/[id]/tags - Remove tag from conversation
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id: conversationId } = await params;
        const searchParams = request.nextUrl.searchParams;
        const tagId = searchParams.get('tagId');

        if (!tagId) {
            throw new ValidationError('Tag ID é obrigatório');
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { organization: true }
        });

        if (!conversation) {
            throw new NotFoundError('Conversa não encontrada');
        }

        if (!canAccessOrganization(user, conversation.organizationId)) {
            throw new ValidationError('Sem permissão');
        }

        // Disconnect tag
        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                tags: {
                    disconnect: { id: tagId }
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
