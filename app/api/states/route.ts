import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, getOrganizationFilter, getOrganizationIdForCreate } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// GET /api/states?agentId=xxx - List states
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');
        const requestedOrgId = searchParams.get('organizationId');

        if (!agentId) {
            throw new ValidationError('agentId é obrigatório');
        }

        const orgFilter = getOrganizationFilter(user, requestedOrgId);

        const states = await prisma.state.findMany({
            where: {
                agentId,
                ...orgFilter,
            },
            orderBy: { order: 'asc' },
        });

        return NextResponse.json(states);
    } catch (error) {
        return handleError(error);
    }
}

// POST /api/states - Create state
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();

        const {
            agentId,
            name,
            missionPrompt,
            availableRoutes,
            dataKey,
            dataDescription,
            dataType,
            mediaId,
            tools,
            crmStatus,
            order,
            organizationId,
        } = body;

        if (!agentId || !name || !missionPrompt || !availableRoutes) {
            throw new ValidationError('Campos obrigatórios faltando');
        }

        const targetOrgId = getOrganizationIdForCreate(user, organizationId);

        const state = await prisma.state.create({
            data: {
                agentId,
                name,
                missionPrompt,
                availableRoutes,
                dataKey,
                dataDescription,
                dataType,
                mediaId,
                tools,
                crmStatus,
                order: order || 0,
                organizationId: targetOrgId,
            },
        });

        return NextResponse.json(state, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}

// PUT /api/states?id=xxx - Update state
export async function PUT(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            throw new ValidationError('ID é obrigatório');
        }

        const body = await request.json();

        const existing = await prisma.state.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ValidationError('Estado não encontrado');
        }

        const orgFilter = getOrganizationFilter(user, null);
        if (orgFilter.organizationId && existing.organizationId !== orgFilter.organizationId) {
            throw new ValidationError('Sem permissão para editar este estado');
        }

        const state = await prisma.state.update({
            where: { id },
            data: body,
        });

        return NextResponse.json(state);
    } catch (error) {
        return handleError(error);
    }
}

// DELETE /api/states?id=xxx - Delete state
export async function DELETE(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            throw new ValidationError('ID é obrigatório');
        }

        const existing = await prisma.state.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ValidationError('Estado não encontrado');
        }

        const orgFilter = getOrganizationFilter(user, null);
        if (orgFilter.organizationId && existing.organizationId !== orgFilter.organizationId) {
            throw new ValidationError('Sem permissão para deletar este estado');
        }

        await prisma.state.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
