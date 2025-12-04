import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; notificationId: string }> }
) {
    try {
        const { notificationId } = await params;
        const body = await request.json();
        const {
            agentStateId,
            matrixItemId,
            leadMessage,
            teamMessage,
            teamPhones,
            isActive
        } = body;

        const notification = await prisma.agentNotification.update({
            where: { id: notificationId },
            data: {
                agentStateId: agentStateId !== undefined ? (agentStateId || null) : undefined,
                matrixItemId: matrixItemId !== undefined ? (matrixItemId || null) : undefined,
                leadMessage: leadMessage !== undefined ? leadMessage : undefined,
                teamMessage: teamMessage !== undefined ? teamMessage : undefined,
                teamPhones: teamPhones !== undefined ? teamPhones : undefined,
                isActive: isActive !== undefined ? isActive : undefined,
            }
        });

        return NextResponse.json(notification);
    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; notificationId: string }> }
) {
    try {
        const { notificationId } = await params;

        await prisma.agentNotification.delete({
            where: { id: notificationId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
