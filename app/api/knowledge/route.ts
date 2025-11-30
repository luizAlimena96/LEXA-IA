import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, getOrganizationFilter, getOrganizationIdForCreate } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// GET /api/knowledge - List knowledge items
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

        const knowledge = await prisma.knowledge.findMany({
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

        return NextResponse.json(knowledge);
    } catch (error) {
        return handleError(error);
    }
}

// POST /api/knowledge - Create knowledge item
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();
        const { title, content, type, agentId, fileUrl, fileName, fileSize, organizationId } = body;

        if (!title || !content || !agentId) {
            throw new ValidationError('Título, conteúdo e agentId são obrigatórios');
        }

        // Determinar organizationId
        const targetOrgId = getOrganizationIdForCreate(user, organizationId);

        const knowledge = await prisma.knowledge.create({
            data: {
                title,
                content,
                type: type || 'TEXT',
                agentId,
                organizationId: targetOrgId,
                fileUrl,
                fileName,
                fileSize,
            },
        });

        return NextResponse.json(knowledge, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}

// PUT /api/knowledge?id=xxx - Update knowledge item
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
        const existing = await prisma.knowledge.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new ValidationError('Conhecimento não encontrado');
        }

        const orgFilter = getOrganizationFilter(user, null);
        if (orgFilter.organizationId && existing.organizationId !== orgFilter.organizationId) {
            throw new ValidationError('Sem permissão para editar este item');
        }

        const knowledge = await prisma.knowledge.update({
            where: { id },
            data: body,
        });

        return NextResponse.json(knowledge);
    } catch (error) {
        return handleError(error);
    }
}

// DELETE /api/knowledge?id=xxx
export async function DELETE(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            throw new ValidationError('ID é obrigatório');
        }

        // Verificar se pertence à organização do usuário
        const knowledge = await prisma.knowledge.findUnique({
            where: { id },
        });

        if (!knowledge) {
            throw new ValidationError('Conhecimento não encontrado');
        }

        const orgFilter = getOrganizationFilter(user, null);
        if (orgFilter.organizationId && knowledge.organizationId !== orgFilter.organizationId) {
            throw new ValidationError('Sem permissão para deletar este item');
        }

        await prisma.knowledge.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
