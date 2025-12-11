import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        // Only SUPER_ADMIN can resolve feedback
        if (user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Apenas super administradores podem resolver feedbacks' },
                { status: 403 }
            );
        }

        // Update feedback status to resolved
        const feedback = await prisma.feedback.update({
            where: { id },
            data: {
                status: 'RESOLVED',
                resolvedAt: new Date(),
            },
        });

        return NextResponse.json(feedback);
    } catch (error) {
        console.error('Error marking feedback as resolved:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
