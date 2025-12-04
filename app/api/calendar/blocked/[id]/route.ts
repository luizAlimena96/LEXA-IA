import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, getOrganizationFilter } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// DELETE /api/calendar/blocked/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        // Verify ownership
        const slot = await prisma.blockedSlot.findUnique({
            where: { id },
            select: { organizationId: true }
        });

        if (!slot) {
            return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
        }

        // Check permissions
        if (user.role !== 'SUPER_ADMIN' && slot.organizationId !== user.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await prisma.blockedSlot.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
