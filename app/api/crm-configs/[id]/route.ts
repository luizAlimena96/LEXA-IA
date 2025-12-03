import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// GET - Get specific CRM config
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;

        const crmConfig = await prisma.cRMConfig.findUnique({
            where: { id },
            include: {
                automations: {
                    orderBy: { order: 'asc' },
                    include: {
                        agentState: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!crmConfig) {
            return NextResponse.json(
                { error: 'CRM config not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(crmConfig);
    } catch (error: any) {
        console.error('Error fetching CRM config:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH - Update CRM config
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;
        const body = await request.json();

        const { name, crmType, baseUrl, authType, apiKey, isActive } = body;

        const crmConfig = await prisma.cRMConfig.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(crmType && { crmType }),
                ...(baseUrl && { baseUrl }),
                ...(authType && { authType }),
                ...(apiKey !== undefined && { apiKey }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json(crmConfig);
    } catch (error: any) {
        console.error('Error updating CRM config:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Delete CRM config
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;

        await prisma.cRMConfig.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting CRM config:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
