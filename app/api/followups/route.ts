import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, getOrganizationFilter, getOrganizationIdForCreate } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// GET /api/followups - List followups
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');
        const requestedOrgId = searchParams.get('organizationId');

        const orgFilter = getOrganizationFilter(user, requestedOrgId);

        const where = {
            ...orgFilter,
            ...(agentId ? { agentId } : {}),
        };

        const followups = await prisma.followup.findMany({
            where,
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(followups);
    } catch (error) {
        return handleError(error);
    }
}

// POST /api/followups - Create followup
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();
        const { name, condition, message, delayHours, agentId, organizationId } = body;

        if (!name || !condition || !message || !agentId) {
            throw new ValidationError('Nome, condição, mensagem e agentId são obrigatórios');
        }

        const targetOrgId = getOrganizationIdForCreate(user, organizationId);

        const followup = await prisma.followup.create({
            data: {
                name,
                condition,
                message,
                delayHours: delayHours || 24,
                delayMinutes: body.delayMinutes || 0,
                agentId,
                organizationId: targetOrgId,
                isActive: true,
                respectBusinessHours: body.respectBusinessHours || false,
                matrixStageId: body.matrixStageId,
                mediaType: body.mediaType || 'text',
                specificTimeEnabled: body.specificTimeEnabled || false,
                specificHour: body.specificHour,
                specificMinute: body.specificMinute,
            },
        });

        return NextResponse.json(followup, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}

// PUT /api/followups?id=xxx - Update followup
export async function PUT(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            throw new ValidationError('ID é obrigatório');
        }

        const body = await request.json();

        const existing = await prisma.followup.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ValidationError('Follow-up não encontrado');
        }

        const orgFilter = getOrganizationFilter(user, null);
        if (orgFilter.organizationId && existing.organizationId !== orgFilter.organizationId) {
            throw new ValidationError('Sem permissão para editar este follow-up');
        }

        const followup = await prisma.followup.update({
            where: { id },
            data: body,
        });

        return NextResponse.json(followup);
    } catch (error) {
        return handleError(error);
    }
}

// DELETE /api/followups?id=xxx
export async function DELETE(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            throw new ValidationError('ID é obrigatório');
        }

        const existing = await prisma.followup.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ValidationError('Follow-up não encontrado');
        }

        const orgFilter = getOrganizationFilter(user, null);
        if (orgFilter.organizationId && existing.organizationId !== orgFilter.organizationId) {
            throw new ValidationError('Sem permissão para deletar este follow-up');
        }

        await prisma.followup.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
