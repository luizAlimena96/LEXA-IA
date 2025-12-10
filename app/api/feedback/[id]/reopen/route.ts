import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';

// PATCH /api/feedback/:id/reopen - Reopen a resolved feedback
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id: feedbackId } = await params;

        // Get feedback to check permissions
        const feedback = await prisma.feedback.findUnique({
            where: { id: feedbackId },
            select: { organizationId: true, status: true },
        });

        if (!feedback) {
            return NextResponse.json(
                { error: 'Feedback not found' },
                { status: 404 }
            );
        }

        // Check permissions
        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== feedback.organizationId) {
            return NextResponse.json(
                { error: 'No permission' },
                { status: 403 }
            );
        }

        // Reopen feedback
        const updatedFeedback = await prisma.feedback.update({
            where: { id: feedbackId },
            data: {
                status: 'PENDING',
                resolvedAt: null,
            },
        });

        return NextResponse.json(updatedFeedback);
    } catch (error) {
        return handleError(error);
    }
}
