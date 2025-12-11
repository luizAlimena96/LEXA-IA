import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';

// GET /api/feedback/:id/responses - Get all responses for a feedback
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;

        const responses = await prisma.feedbackResponse.findMany({
            where: { feedbackId: id },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json(responses);
    } catch (error) {
        return handleError(error);
    }
}
