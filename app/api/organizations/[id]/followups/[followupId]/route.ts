import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// PUT - Update followup
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string; followupId: string } }
) {
    try {
        const body = await request.json();

        const followup = await prisma.followup.update({
            where: { id: params.followupId },
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
    { params }: { params: { id: string; followupId: string } }
) {
    try {
        await prisma.followup.delete({
            where: { id: params.followupId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting followup:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
