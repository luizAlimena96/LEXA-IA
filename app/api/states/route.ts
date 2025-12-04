import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, getOrganizationFilter } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// GET /api/states
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const searchParams = request.nextUrl.searchParams;
        const organizationId = searchParams.get('organizationId');
        const agentId = searchParams.get('agentId');

        const orgFilter = getOrganizationFilter(user, organizationId);

        const where: any = {
            ...orgFilter,
        };

        if (agentId) {
            where.agentId = agentId;
        }

        const states = await prisma.state.findMany({
            where,
            orderBy: { order: 'asc' }
        });

        return NextResponse.json(states);
    } catch (error) {
        return handleError(error);
    }
}

// POST /api/states
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();
        const {
            name,
            missionPrompt,
            availableRoutes,
            agentId,
            tools,
            crmStatus,
            mediaId,
            mediaTiming,
            responseType,
            organizationId,
            dataKey,
            dataDescription,
            dataType,
            matrixItemId
        } = body;

        if (!name || !missionPrompt || !agentId) {
            throw new ValidationError('Campos obrigatórios faltando');
        }

        // Determine organization ID
        let targetOrgId = user.organizationId;
        if (user.role === 'SUPER_ADMIN' && organizationId) {
            targetOrgId = organizationId;
        }

        if (!targetOrgId) {
            throw new ValidationError('Organização não identificada');
        }

        const state = await prisma.state.create({
            data: {
                name,
                missionPrompt,
                availableRoutes: availableRoutes || {},
                agentId,
                organizationId: targetOrgId,
                tools,
                crmStatus,
                mediaId,
                mediaTiming,
                responseType,
                dataDescription,
                dataType,
                matrixItemId,
            }
        });

        return NextResponse.json(state, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}

// PUT /api/states
export async function PUT(request: NextRequest) {
    try {
        const user = await requireAuth();
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');
        const body = await request.json();

        if (!id) {
            throw new ValidationError('ID is required');
        }

        // Verify ownership
        const existingState = await prisma.state.findUnique({
            where: { id },
            select: { organizationId: true }
        });

        if (!existingState) {
            return NextResponse.json({ error: 'State not found' }, { status: 404 });
        }

        if (user.role !== 'SUPER_ADMIN' && existingState.organizationId !== user.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const {
            id: _id,
            createdAt,
            updatedAt,
            organizationId,
            agentId,
            ...updateData
        } = body;

        const state = await prisma.state.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(state);
    } catch (error) {
        return handleError(error);
    }
}

// DELETE /api/states
export async function DELETE(request: NextRequest) {
    try {
        const user = await requireAuth();
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            throw new ValidationError('ID is required');
        }

        // Verify ownership
        const existingState = await prisma.state.findUnique({
            where: { id },
            select: { organizationId: true }
        });

        if (!existingState) {
            return NextResponse.json({ error: 'State not found' }, { status: 404 });
        }

        if (user.role !== 'SUPER_ADMIN' && existingState.organizationId !== user.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await prisma.state.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
