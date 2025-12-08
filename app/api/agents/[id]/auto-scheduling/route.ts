// API Route: /api/agents/[id]/auto-scheduling
// Manage auto-scheduling configurations for an agent

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
    getAutoSchedulingConfigs,
    createAutoSchedulingConfig,
    type CreateAutoSchedulingConfigInput,
} from '@/app/services/autoSchedulingService';
import { prisma } from '@/app/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: agentId } = await params;

        // Verify agent belongs to user's organization
        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
            select: { organizationId: true },
        });

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        const configs = await getAutoSchedulingConfigs(agentId);
        return NextResponse.json(configs);
    } catch (error) {
        console.error('Error fetching auto-scheduling configs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch auto-scheduling configs' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: agentId } = await params;

        // Verify agent belongs to user's organization
        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
            select: { organizationId: true },
        });

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        const body: CreateAutoSchedulingConfigInput = await request.json();

        // Validate required fields
        if (!body.crmStageId || !body.messageTemplate) {
            return NextResponse.json(
                { error: 'crmStageId and messageTemplate are required' },
                { status: 400 }
            );
        }

        const config = await createAutoSchedulingConfig(agentId, body);
        return NextResponse.json(config, { status: 201 });
    } catch (error: any) {
        console.error('Error creating auto-scheduling config:', error);

        // Handle unique constraint violation
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'A configuration already exists for this CRM stage' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create auto-scheduling config' },
            { status: 500 }
        );
    }
}
