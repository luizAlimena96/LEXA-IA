import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';

// POST /api/feedback - Create new feedback
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();

        const { comment, customerName, phone, conversationId, organizationId, rating } = body;

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

        // Map rating to severity (INVERTED SCALE)
        // ⭐⭐⭐⭐⭐ (5) = CRITICAL
        // ⭐⭐⭐⭐ (4) = HIGH
        // ⭐⭐⭐ (3) = MEDIUM
        // ⭐⭐ (2) = LOW
        // ⭐ (1) = LOW
        let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';

        if (rating !== undefined && rating !== null) {
            if (rating === 5) {
                severity = 'CRITICAL';
            } else if (rating === 4) {
                severity = 'HIGH';
            } else if (rating === 3) {
                severity = 'MEDIUM';
            } else if (rating <= 2) {
                severity = 'LOW';
            }
        }

        // Create feedback
        const feedback = await prisma.feedback.create({
            data: {
                customer: customerName,
                phone,
                message: comment,
                rating: rating || 3, // Default to 3 if not provided
                status: 'PENDING',
                severity,
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
        const status = searchParams.get('status'); // Add status filter

        const where: any = {};

        if (user.role !== 'SUPER_ADMIN') {
            where.organizationId = user.organizationId;
        } else if (organizationId) {
            where.organizationId = organizationId;
        }

        // Add status filter if provided
        if (status && (status === 'PENDING' || status === 'RESOLVED')) {
            where.status = status;
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
