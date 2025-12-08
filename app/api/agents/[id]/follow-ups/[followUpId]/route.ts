import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; followUpId: string }> }
) {
    try {
        const { followUpId } = await params;
        const body = await request.json();
        const { name, agentStateId, crmStageId, delayMinutes, messageTemplate, isActive, triggerMode, scheduledTime, mediaUrls, videoUrl, businessHoursEnabled, businessHoursStart, businessHoursEnd } = body;

        const followUp = await prisma.agentFollowUp.update({
            where: { id: followUpId },
            data: {
                name: name !== undefined ? name : undefined,
                agentStateId: agentStateId !== undefined ? (agentStateId || null) : undefined,
                crmStageId: crmStageId !== undefined ? (crmStageId || null) : undefined,
                delayMinutes: delayMinutes !== undefined ? (delayMinutes ? Number(delayMinutes) : null) : undefined,
                messageTemplate: messageTemplate !== undefined ? messageTemplate : undefined,
                isActive: isActive !== undefined ? isActive : undefined,
                triggerMode: triggerMode !== undefined ? triggerMode : undefined,
                scheduledTime: scheduledTime !== undefined ? scheduledTime : undefined,
                mediaUrls: mediaUrls !== undefined ? mediaUrls : undefined,
                videoUrl: videoUrl !== undefined ? videoUrl : undefined,
                businessHoursEnabled: businessHoursEnabled !== undefined ? businessHoursEnabled : undefined,
                businessHoursStart: businessHoursStart !== undefined ? businessHoursStart : undefined,
                businessHoursEnd: businessHoursEnd !== undefined ? businessHoursEnd : undefined,
            },
            include: {
                agentState: true,
                crmStage: true,
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
