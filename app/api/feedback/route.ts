import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';

// POST /api/feedback - Create new feedback
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();

        const { comment, customerName, phone, conversationId, organizationId } = body;

        if (!comment || !customerName) {
            return NextResponse.json(
                { error: 'Comment and customer name are required' },
                { status: 400 }
            );
        }

        // Get organizationId from conversation if not provided
        let finalOrganizationId = organizationId;

        if (!finalOrganizationId && conversationId) {
            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                select: { organizationId: true },
            });
            finalOrganizationId = conversation?.organizationId;
        }

        // If still no organizationId, use user's organizationId
        if (!finalOrganizationId && user.organizationId) {
            finalOrganizationId = user.organizationId;
        }

        // Create feedback
        const feedback = await prisma.feedback.create({
            data: {
                customer: customerName,
                phone,
                message: comment,
                status: 'PENDING',
                severity: 'MEDIUM',
                conversationId: conversationId || null,
                organizationId: finalOrganizationId || null,
            },
        });

        return NextResponse.json(feedback);
    } catch (error) {
        return handleError(error);
    }
}

// GET /api/feedback - Get all feedbacks
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');

        const where: any = {};

        if (user.role !== 'SUPER_ADMIN') {
            where.organizationId = user.organizationId;
        } else if (organizationId) {
            where.organizationId = organizationId;
        }

        const feedbacks = await prisma.feedback.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(feedbacks);
    } catch (error) {
        return handleError(error);
    }
}
