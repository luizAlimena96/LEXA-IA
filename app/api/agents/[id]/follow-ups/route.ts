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
                crmStage: true,
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
        const { name, agentStateId, crmStageId, delayMinutes, messageTemplate, triggerMode, scheduledTime, mediaUrls, videoUrl, businessHoursEnabled, businessHoursStart, businessHoursEnd } = body;

        if (!name || !messageTemplate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const followUp = await prisma.agentFollowUp.create({
            data: {
                name,
                agentId,
                agentStateId: agentStateId || null,
                crmStageId: crmStageId || null,
                delayMinutes: delayMinutes ? Number(delayMinutes) : null,
                messageTemplate,
                triggerMode: triggerMode || 'TIMER',
                scheduledTime: scheduledTime || null,
                mediaUrls: mediaUrls || [],
                videoUrl: videoUrl || null,
                businessHoursEnabled: businessHoursEnabled || false,
                businessHoursStart: businessHoursStart || null,
                businessHoursEnd: businessHoursEnd || null,
                isActive: true,
            },
            include: {
                agentState: true,
                crmStage: true,
            }
        });

        return NextResponse.json(followUp);
    } catch (error) {
        console.error('Error creating follow-up:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
