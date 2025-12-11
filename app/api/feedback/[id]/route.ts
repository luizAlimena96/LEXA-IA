import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';

// DELETE /api/feedback/:id - Delete feedback (SUPER_ADMIN only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        // Only SUPER_ADMIN can delete feedback
        if (user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Apenas super administradores podem deletar feedbacks' },
                { status: 403 }
            );
        }

        // Delete feedback
        await prisma.feedback.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
