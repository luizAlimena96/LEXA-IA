import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// PUT - Update followup
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; followupId: string }> }
) {
    try {
        const { followupId } = await params;
        const body = await request.json();

        const followup = await prisma.followup.update({
            where: { id: followupId },
            data: body,
        });

        return NextResponse.json(followup);
    } catch (error) {
        console.error('Error updating followup:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Delete followup
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; followupId: string }> }
) {
    try {
        const { followupId } = await params;

        await prisma.followup.delete({
            where: { id: followupId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting followup:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
