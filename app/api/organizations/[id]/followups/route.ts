import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET - List all followups for organization
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const followups = await prisma.followup.findMany({
            where: { organizationId: params.id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(followups);
    } catch (error) {
        console.error('Error fetching followups:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create new followup
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        // Get first agent for this organization
        const agent = await prisma.agent.findFirst({
            where: { organizationId: params.id },
        });

        if (!agent) {
            return NextResponse.json({ error: 'No agent found' }, { status: 404 });
        }

        const followup = await prisma.followup.create({
            data: {
                ...body,
                agentId: agent.id,
                organizationId: params.id,
            },
        });

        return NextResponse.json(followup);
    } catch (error) {
        console.error('Error creating followup:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
