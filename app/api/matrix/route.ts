import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, getOrganizationFilter, getOrganizationIdForCreate } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// GET /api/matrix - List matrix items
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

        const matrix = await prisma.matrixItem.findMany({
            where,
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        return NextResponse.json(matrix);
    } catch (error) {
        return handleError(error);
    }
}

// POST /api/matrix - Create matrix item
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();
        const { title, category, description, response, priority, agentId, organizationId } = body;

        if (!title || !category || !description || !response || !agentId) {
            throw new ValidationError('Todos os campos são obrigatórios');
        }

        const targetOrgId = getOrganizationIdForCreate(user, organizationId);

        const matrixItem = await prisma.matrixItem.create({
            data: {
                title,
                category,
                description,
                response,
                priority: priority || 1,
                agentId,
                organizationId: targetOrgId,
            },
        });

        return NextResponse.json(matrixItem, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}

// PUT /api/matrix?id=xxx - Update matrix item
export async function PUT(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            throw new ValidationError('ID é obrigatório');
        }

        const body = await request.json();

        // Verificar permissão
        const existing = await prisma.matrixItem.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ValidationError('Item não encontrado');
        }

        const orgFilter = getOrganizationFilter(user, null);
        if (orgFilter.organizationId && existing.organizationId !== orgFilter.organizationId) {
            throw new ValidationError('Sem permissão para editar este item');
        }

        const matrixItem = await prisma.matrixItem.update({
            where: { id },
            data: body,
        });

        return NextResponse.json(matrixItem);
    } catch (error) {
        return handleError(error);
    }
}

// DELETE /api/matrix?id=xxx
export async function DELETE(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            throw new ValidationError('ID é obrigatório');
        }

        const existing = await prisma.matrixItem.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ValidationError('Item não encontrado');
        }

        const orgFilter = getOrganizationFilter(user, null);
        if (orgFilter.organizationId && existing.organizationId !== orgFilter.organizationId) {
            throw new ValidationError('Sem permissão para deletar este item');
        }

        await prisma.matrixItem.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
