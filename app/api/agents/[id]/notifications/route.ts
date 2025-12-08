import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: agentId } = await params;

        const notifications = await prisma.agentNotification.findMany({
            where: { agentId },
            include: {
                agentState: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: agentId } = await params;
        const body = await request.json();
        const {
            agentStateId,
            leadMessage,
            teamMessage,
            teamPhones
        } = body;

        if (!agentStateId) {
            return NextResponse.json({ error: 'Agent State is required' }, { status: 400 });
        }

        const notification = await prisma.agentNotification.create({
            data: {
                agentId,
                agentStateId: agentStateId || null,
                leadMessage,
                teamMessage,
                teamPhones: teamPhones || [],
                isActive: true,
            }
        });

        return NextResponse.json(notification);
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
