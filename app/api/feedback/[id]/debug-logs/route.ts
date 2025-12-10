import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';

// GET /api/feedback/:id/debug-logs
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id: feedbackId } = await params;

        // Get feedback to find conversationId
        const feedback = await prisma.feedback.findUnique({
            where: { id: feedbackId },
            select: { conversationId: true, organizationId: true },
        });

        if (!feedback || !feedback.conversationId) {
            return NextResponse.json({ debugLogs: [] });
        }

        // Check permissions
        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== feedback.organizationId) {
            return NextResponse.json(
                { error: 'No permission' },
                { status: 403 }
            );
        }

        // Get all debug logs for this conversation
        const debugLogs = await prisma.debugLog.findMany({
            where: {
                conversationId: feedback.conversationId,
            },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                clientMessage: true,
                aiResponse: true,
                aiThinking: true,
                currentState: true,
                createdAt: true,
            },
        });

        return NextResponse.json(debugLogs);
    } catch (error) {
        return handleError(error);
    }
}
