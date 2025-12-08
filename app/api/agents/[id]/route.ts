import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const searchParams = request.nextUrl.searchParams;
        const includeParam = searchParams.get('include');

        const include: any = {
            _count: {
                select: {
                    leads: true,
                    conversations: true,
                    knowledge: true,
                    followups: true,
                    reminders: true,
                },
            },
        };

        if (includeParam) {
            const relations = includeParam.split(',');
            if (relations.includes('states')) include.states = true;
        }

        const agent = await prisma.agent.findUnique({
            where: { id },
            include,
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

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let body: any;
    try {
        const { id } = await params;
        body = await request.json();

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

        if (updateData.tone && typeof updateData.tone === 'string') {
            updateData.tone = updateData.tone.toUpperCase();
        }

        const agent = await prisma.agent.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(agent);
    } catch (error) {
        console.error('Error updating agent:', error);
        console.error('Update data:', JSON.stringify(body, null, 2));

        return NextResponse.json(
            {
                error: 'Failed to update agent',
                details: error instanceof Error ? error.message : 'Unknown error',
                fields: Object.keys(body || {})
            },
            { status: 500 }
        );
    }
}

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
