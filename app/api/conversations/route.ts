import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// GET /api/conversations - List conversations
export async function GET(request: NextRequest) {
    try {
        // Authentication handled by backend
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            throw new ValidationError('Organization ID is required');
        }

        const conversations = await prisma.conversation.findMany({
            where: {
                organizationId,
            },
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
                    take: 1,
                },
                agent: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                tags: true,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        return NextResponse.json(conversations);
    } catch (error) {
        return handleError(error);
    }
}

// POST /api/conversations - Create conversation
export async function POST(request: NextRequest) {
    try {
        // Authentication handled by backend
        const body = await request.json();
        const { whatsapp, organizationId, agentId, leadId } = body;

        if (!whatsapp || !organizationId || !agentId) {
            throw new ValidationError('WhatsApp, organizationId, and agentId are required');
        }

        // Check if conversation already exists
        const existing = await prisma.conversation.findFirst({
            where: {
                whatsapp,
                organizationId,
            },
        });

        if (existing) {
            return NextResponse.json(existing);
        }

        const conversation = await prisma.conversation.create({
            data: {
                whatsapp,
                organizationId,
                agentId,
                leadId,
            },
            include: {
                lead: true,
                agent: true,
            },
        });

        return NextResponse.json(conversation, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
