// API Route: /api/agents/[id]/auto-scheduling/test-slots
// Test slot availability for auto-scheduling

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
    getAutoSchedulingConfig,
    getAvailableSlots,
} from '@/app/services/autoSchedulingService';

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
        const body = await request.json();
        const { configId, limit = 3 } = body;

        if (!configId) {
            return NextResponse.json(
                { error: 'configId is required' },
                { status: 400 }
            );
        }

        const config = await getAutoSchedulingConfig(agentId, configId);

        if (!config) {
            return NextResponse.json({ error: 'Config not found' }, { status: 404 });
        }

        const slots = await getAvailableSlots(agentId, config, limit);

        return NextResponse.json({ slots });
    } catch (error) {
        console.error('Error testing slots:', error);
        return NextResponse.json(
            { error: 'Failed to test slots' },
            { status: 500 }
        );
    }
}
