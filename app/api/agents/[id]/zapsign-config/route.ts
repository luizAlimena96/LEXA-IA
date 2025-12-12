import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';

// GET /api/agents/[id]/zapsign-config
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id: agentId } = await params;

        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
            select: {
                zapSignFieldMapping: true,
                zapSignTriggerCrmStageId: true,
            },
        });

        if (!agent) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            fieldMappings: agent.zapSignFieldMapping || [],
            triggerCrmStageId: agent.zapSignTriggerCrmStageId,
        });
    } catch (error: any) {
        console.error('Error loading ZapSign config:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to load config' },
            { status: 500 }
        );
    }
}

// PUT /api/agents/[id]/zapsign-config
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id: agentId } = await params;
        const body = await request.json();
        const { fieldMappings, triggerCrmStageId } = body;

        if (!Array.isArray(fieldMappings)) {
            return NextResponse.json(
                { error: 'fieldMappings must be an array' },
                { status: 400 }
            );
        }

        const agent = await prisma.agent.update({
            where: { id: agentId },
            data: {
                zapSignFieldMapping: fieldMappings,
                zapSignTriggerCrmStageId: triggerCrmStageId || null,
            },
        });

        return NextResponse.json({
            success: true,
            fieldMappings: agent.zapSignFieldMapping,
            triggerCrmStageId: agent.zapSignTriggerCrmStageId,
        });
    } catch (error: any) {
        console.error('Error saving ZapSign config:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save config' },
            { status: 500 }
        );
    }
}
