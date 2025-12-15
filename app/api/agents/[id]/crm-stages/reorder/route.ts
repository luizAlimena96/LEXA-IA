// API Route: /api/agents/[id]/crm-stages/reorder
// Reorder CRM stages

import { NextRequest, NextResponse } from 'next/server';
import { reorderCRMStages } from '@/app/services/crmStageService';

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
        const body = await request.json();

        if (!body.stages || !Array.isArray(body.stages)) {
            return NextResponse.json(
                { error: 'Invalid request body' },
                { status: 400 }
            );
        }

        await reorderCRMStages(agentId, body.stages);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error reordering CRM stages:', error);
        return NextResponse.json(
            { error: 'Failed to reorder CRM stages' },
            { status: 500 }
        );
    }
}
