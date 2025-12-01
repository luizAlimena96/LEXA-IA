import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, canAccessOrganization } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// GET /api/conversations - List conversations
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('organizationId');

        // Determine which organization to query
        const organizationId = user.role === 'SUPER_ADMIN' && orgId
            ? orgId
            : user.organizationId;

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
        const user = await requireAuth();
        const body = await request.json();
        const { whatsapp, organizationId, agentId, leadId } = body;

        if (!whatsapp || !organizationId || !agentId) {
            throw new ValidationError('WhatsApp, organizationId, and agentId are required');
        }

        // Check permissions
        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== organizationId) {
            throw new ValidationError('No permission');
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
