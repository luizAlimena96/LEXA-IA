// API Route: /api/agents/[id]/crm-stages/[stageId]
// Manage individual CRM stage

import { NextRequest, NextResponse } from 'next/server';
import {
    getCRMStage,
    updateCRMStage,
    deleteCRMStage,
    type UpdateCRMStageInput,
} from '@/app/services/crmStageService';
import { prisma } from '@/app/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; stageId: string }> }
) {
    try {
        // Authentication handled by backend
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: agentId, stageId } = await params;

        const stage = await getCRMStage(agentId, stageId);

        if (!stage) {
            return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
        }

        return NextResponse.json(stage);
    } catch (error) {
        console.error('Error fetching CRM stage:', error);
        return NextResponse.json(
            { error: 'Failed to fetch CRM stage' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; stageId: string }> }
) {
    try {
        // Authentication handled by backend
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: agentId, stageId } = await params;
        const body: UpdateCRMStageInput = await request.json();

        const stage = await updateCRMStage(agentId, stageId, body);
        return NextResponse.json(stage);
    } catch (error: any) {
        console.error('Error updating CRM stage:', error);

        // Handle unique constraint violation
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'A stage with this name already exists for this agent' },
                { status: 409 }
            );
        }

        // Handle not found
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
        }

        return NextResponse.json(
            { error: 'Failed to update CRM stage' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; stageId: string }> }
) {
    try {
        // Authentication handled by backend
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: agentId, stageId } = await params;

        // Verificar se o stage existe e pertence ao agente
        const stage = await prisma.cRMStage.findUnique({
            where: { id: stageId },
        });

        if (!stage) {
            return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
        }

        if (stage.agentId !== agentId) {
            return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
        }

        await deleteCRMStage(agentId, stageId);
        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        console.error('Error deleting CRM stage:', error);

        // Handle not found
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
        }

        return NextResponse.json(
            { error: 'Failed to delete CRM stage' },
            { status: 500 }
        );
    }
}
