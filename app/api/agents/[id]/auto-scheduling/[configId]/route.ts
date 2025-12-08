// API Route: /api/agents/[id]/auto-scheduling/[configId]
// Manage individual auto-scheduling configuration

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
    getAutoSchedulingConfig,
    updateAutoSchedulingConfig,
    deleteAutoSchedulingConfig,
    type UpdateAutoSchedulingConfigInput,
} from '@/app/services/autoSchedulingService';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; configId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: agentId, configId } = await params;

        const config = await getAutoSchedulingConfig(agentId, configId);

        if (!config) {
            return NextResponse.json({ error: 'Config not found' }, { status: 404 });
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error fetching auto-scheduling config:', error);
        return NextResponse.json(
            { error: 'Failed to fetch auto-scheduling config' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; configId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: agentId, configId } = await params;
        const body: UpdateAutoSchedulingConfigInput = await request.json();

        const config = await updateAutoSchedulingConfig(agentId, configId, body);
        return NextResponse.json(config);
    } catch (error: any) {
        console.error('Error updating auto-scheduling config:', error);

        // Handle not found
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Config not found' }, { status: 404 });
        }

        return NextResponse.json(
            { error: 'Failed to update auto-scheduling config' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; configId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: agentId, configId } = await params;

        await deleteAutoSchedulingConfig(agentId, configId);
        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        console.error('Error deleting auto-scheduling config:', error);

        // Handle not found
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Config not found' }, { status: 404 });
        }

        return NextResponse.json(
            { error: 'Failed to delete auto-scheduling config' },
            { status: 500 }
        );
    }
}
