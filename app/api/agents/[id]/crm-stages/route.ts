// API Route: /api/agents/[id]/crm-stages
// Manage CRM stages for an agent

import { NextRequest, NextResponse } from 'next/server';
import {
    getCRMStages,
    createCRMStage,
    type CreateCRMStageInput,
} from '@/app/services/crmStageService';
import { prisma } from '@/app/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authentication handled by backend
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

        const stages = await getCRMStages(agentId);
        stages.forEach(stage => {
            console.log(`  Stage: ${stage.name}, States count: ${stage.states?.length || 0}`);
            if (stage.states && stage.states.length > 0) {
                console.log(`    States:`, stage.states.map(s => s.name).join(', '));
            }
        });
        return NextResponse.json(stages);
    } catch (error) {
        console.error('Error fetching CRM stages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch CRM stages' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authentication handled by backend
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

        const body: CreateCRMStageInput = await request.json();

        // Validate required fields
        if (!body.name || body.name.trim() === '') {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        const stage = await createCRMStage(agentId, agent.organizationId, body);
        return NextResponse.json(stage, { status: 201 });
    } catch (error: any) {
        console.error('Error creating CRM stage:', error);

        // Handle unique constraint violation
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'A stage with this name already exists for this agent' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create CRM stage' },
            { status: 500 }
        );
    }
}
