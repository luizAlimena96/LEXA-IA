import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// GET - List automations
export async function GET(request: NextRequest) {
    try {
        await requireAuth();
        const { searchParams } = new URL(request.url);
        const crmConfigId = searchParams.get('crmConfigId');
        const agentStateId = searchParams.get('agentStateId');
        const matrixItemId = searchParams.get('matrixItemId');

        const where: any = {};
        if (crmConfigId) where.crmConfigId = crmConfigId;
        if (agentStateId) where.agentStateId = agentStateId;
        if (matrixItemId) where.matrixItemId = matrixItemId;

        const automations = await prisma.cRMAutomation.findMany({
            where,
            orderBy: { order: 'asc' },
            include: {
                crmConfig: {
                    select: {
                        id: true,
                        name: true,
                        crmType: true,
                    },
                },
                agentState: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                matrixItem: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                    },
                },
            },
        });

        return NextResponse.json(automations);
    } catch (error: any) {
        console.error('Error fetching automations:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Create automation
export async function POST(request: NextRequest) {
    try {
        await requireAuth();
        const body = await request.json();

        const { crmConfigId, agentStateId, matrixItemId, name, description, actions, order } = body;

        if (!crmConfigId || !name || !actions) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate that either agentStateId or matrixItemId is provided
        if (!agentStateId && !matrixItemId) {
            return NextResponse.json(
                { error: 'Either agentStateId or matrixItemId must be provided' },
                { status: 400 }
            );
        }

        const automation = await prisma.cRMAutomation.create({
            data: {
                crmConfigId,
                agentStateId: agentStateId || null,
                matrixItemId: matrixItemId || null,
                name,
                description: description || null,
                actions,
                order: order || 0,
                isActive: true,
            },
            include: {
                crmConfig: true,
                agentState: true,
                matrixItem: true,
            },
        });

        return NextResponse.json(automation, { status: 201 });
    } catch (error: any) {
        console.error('Error creating automation:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
