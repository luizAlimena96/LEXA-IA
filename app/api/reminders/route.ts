import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, getOrganizationFilter, getOrganizationIdForCreate } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// GET /api/reminders - List reminders
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

        const reminders = await prisma.reminder.findMany({
            where,
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { scheduledFor: 'asc' },
        });

        return NextResponse.json(reminders);
    } catch (error) {
        return handleError(error);
    }
}

// POST /api/reminders - Create reminder
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();
        const { title, message, scheduledFor, recipients, agentId, organizationId } = body;

        if (!title || !message || !scheduledFor || !agentId) {
            throw new ValidationError('Título, mensagem, data e agentId são obrigatórios');
        }

        const targetOrgId = getOrganizationIdForCreate(user, organizationId);

        const reminder = await prisma.reminder.create({
            data: {
                title,
                message,
                scheduledFor: new Date(scheduledFor),
                recipients: recipients || [],
                agentId,
                organizationId: targetOrgId,
                isActive: true,
            },
        });

        return NextResponse.json(reminder, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}

// PUT /api/reminders?id=xxx - Update reminder
export async function PUT(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            throw new ValidationError('ID é obrigatório');
        }

        const body = await request.json();

        const existing = await prisma.reminder.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ValidationError('Lembrete não encontrado');
        }

        const orgFilter = getOrganizationFilter(user, null);
        if (orgFilter.organizationId && existing.organizationId !== orgFilter.organizationId) {
            throw new ValidationError('Sem permissão para editar este lembrete');
        }

        const reminder = await prisma.reminder.update({
            where: { id },
            data: {
                ...body,
                ...(body.scheduledFor ? { scheduledFor: new Date(body.scheduledFor) } : {}),
            },
        });

        return NextResponse.json(reminder);
    } catch (error) {
        return handleError(error);
    }
}

// DELETE /api/reminders?id=xxx
export async function DELETE(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            throw new ValidationError('ID é obrigatório');
        }

        const existing = await prisma.reminder.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ValidationError('Lembrete não encontrado');
        }

        const orgFilter = getOrganizationFilter(user, null);
        if (orgFilter.organizationId && existing.organizationId !== orgFilter.organizationId) {
            throw new ValidationError('Sem permissão para deletar este lembrete');
        }

        await prisma.reminder.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
