import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// GET - Get specific automation
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;

        const automation = await prisma.cRMAutomation.findUnique({
            where: { id },
            include: {
                crmConfig: true,
                agentState: true,
            },
        });

        if (!automation) {
            return NextResponse.json(
                { error: 'Automation not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(automation);
    } catch (error: any) {
        console.error('Error fetching automation:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH - Update automation
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;
        const body = await request.json();

        const { name, description, actions, order, isActive, agentStateId } = body;

        const automation = await prisma.cRMAutomation.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(actions && { actions }),
                ...(order !== undefined && { order }),
                ...(isActive !== undefined && { isActive }),
                ...(agentStateId !== undefined && { agentStateId }),
            },
            include: {
                crmConfig: true,
                agentState: true,
            },
        });

        return NextResponse.json(automation);
    } catch (error: any) {
        console.error('Error updating automation:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Delete automation
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;

        await prisma.cRMAutomation.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting automation:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
