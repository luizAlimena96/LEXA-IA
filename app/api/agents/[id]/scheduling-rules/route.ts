// API Route: Get and Update Advanced Scheduling Rules for Agent

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: agentId } = await params;

        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
            select: {
                id: true,
                name: true,
                minAdvanceHours: true,
                allowDynamicDuration: true,
                minMeetingDuration: true,
                maxMeetingDuration: true,
                customTimeWindows: true,
                useCustomTimeWindows: true,
                notificationPhone: true,
                notificationEnabled: true,
                notificationTemplate: true,
                meetingDuration: true,
                bufferTime: true,
                workingHours: true,
            }
        });

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        return NextResponse.json(agent);
    } catch (error) {
        console.error('Error fetching scheduling rules:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: agentId } = await params;
        const body = await request.json();

        const agent = await prisma.agent.update({
            where: { id: agentId },
            data: {
                minAdvanceHours: body.minAdvanceHours,
                allowDynamicDuration: body.allowDynamicDuration,
                minMeetingDuration: body.minMeetingDuration,
                maxMeetingDuration: body.maxMeetingDuration,
                customTimeWindows: body.customTimeWindows,
                useCustomTimeWindows: body.useCustomTimeWindows,
                notificationPhone: body.notificationPhone,
                notificationEnabled: body.notificationEnabled,
                notificationTemplate: body.notificationTemplate,
                meetingDuration: body.meetingDuration,
                bufferTime: body.bufferTime,
            },
            select: {
                id: true,
                name: true,
                minAdvanceHours: true,
                allowDynamicDuration: true,
                minMeetingDuration: true,
                maxMeetingDuration: true,
                customTimeWindows: true,
                useCustomTimeWindows: true,
                notificationPhone: true,
                notificationEnabled: true,
                notificationTemplate: true,
            }
        });

        return NextResponse.json(agent);
    } catch (error) {
        console.error('Error updating scheduling rules:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
