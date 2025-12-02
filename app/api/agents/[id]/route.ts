import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET /api/agents/[id] - Get agent by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const agent = await prisma.agent.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        leads: true,
                        conversations: true,
                        knowledge: true,
                        matrix: true,
                        followups: true,
                        reminders: true,
                    },
                },
            },
        });

        if (!agent) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(agent);
    } catch (error) {
        console.error('Error fetching agent:', error);
        return NextResponse.json(
            { error: 'Failed to fetch agent' },
            { status: 500 }
        );
    }
}

// PUT /api/agents/[id] - Update agent
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Remove fields that shouldn't be updated directly
        const {
            id: _id,
            createdAt,
            updatedAt,
            organizationId,
            userId,
            _count,
            organization,
            user,
            ...updateData
        } = body;

        const agent = await prisma.agent.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(agent);
    } catch (error) {
        console.error('Error updating agent:', error);
        return NextResponse.json(
            { error: 'Failed to update agent' },
            { status: 500 }
        );
    }
}

// DELETE /api/agents/[id] - Delete agent
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.agent.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting agent:', error);
        return NextResponse.json(
            { error: 'Failed to delete agent' },
            { status: 500 }
        );
    }
}
