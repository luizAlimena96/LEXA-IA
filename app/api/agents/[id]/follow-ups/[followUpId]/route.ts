import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; followUpId: string }> }
) {
    try {
        const { followUpId } = await params;
        const body = await request.json();
        const { agentStateId, matrixItemId, delayMinutes, messageTemplate, isActive } = body;

        const followUp = await prisma.agentFollowUp.update({
            where: { id: followUpId },
            data: {
                agentStateId: agentStateId !== undefined ? (agentStateId || null) : undefined,
                matrixItemId: matrixItemId !== undefined ? (matrixItemId || null) : undefined,
                delayMinutes: delayMinutes !== undefined ? Number(delayMinutes) : undefined,
                messageTemplate: messageTemplate !== undefined ? messageTemplate : undefined,
                isActive: isActive !== undefined ? isActive : undefined,
            }
        });

        return NextResponse.json(followUp);
    } catch (error) {
        console.error('Error updating follow-up:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; followUpId: string }> }
) {
    try {
        const { followUpId } = await params;

        await prisma.agentFollowUp.delete({
            where: { id: followUpId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting follow-up:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
