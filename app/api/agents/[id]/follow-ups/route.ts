import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: agentId } = await params;

        const followUps = await prisma.agentFollowUp.findMany({
            where: { agentId },
            include: {
                agentState: true,
                matrixItem: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(followUps);
    } catch (error) {
        console.error('Error fetching follow-ups:', error);
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
        const { agentStateId, matrixItemId, delayMinutes, messageTemplate } = body;

        if (!delayMinutes || !messageTemplate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const followUp = await prisma.agentFollowUp.create({
            data: {
                agentId,
                agentStateId: agentStateId || null,
                matrixItemId: matrixItemId || null,
                delayMinutes: Number(delayMinutes),
                messageTemplate,
                isActive: true,
            }
        });

        return NextResponse.json(followUp);
    } catch (error) {
        console.error('Error creating follow-up:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
