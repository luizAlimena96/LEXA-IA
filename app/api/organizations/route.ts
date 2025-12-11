import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireSuperAdmin, requireAuth, canAccessOrganization } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError, NotFoundError } from '@/app/lib/errors';

// GET /api/organizations - Listar organizações
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        // Super Admin vê todas as organizações
        // Outros usuários veem apenas a sua
        const where = user.role === 'SUPER_ADMIN'
            ? {}
            : { id: user.organizationId || '' };

        const organizations = await prisma.organization.findMany({
            where,
            select: {
                id: true,
                name: true,
                slug: true,
                email: true,
                phone: true,
                isActive: true,
                whatsappConnected: true,
                googleCalendarEnabled: true,
                googleTokenExpiry: true,
                crmEnabled: true,
                crmType: true,
                openaiApiKey: true,
                openaiProjectId: true,
                elevenLabsApiKey: true,
                elevenLabsVoiceId: true,
                evolutionApiUrl: true,
                evolutionInstanceName: true,
                zapSignApiToken: true,
                zapSignTemplateId: true,
                _count: {
                    select: {
                        users: true,
                        agents: true,
                        leads: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(organizations);
    } catch (error) {
        return handleError(error);
    }
}

// POST /api/organizations - Criar organização (Super Admin only)
export async function POST(request: NextRequest) {
    try {
        const user = await requireSuperAdmin();
        const body = await request.json();

        const { name, slug, email, phone, settings } = body;

        if (!name || !slug) {
            throw new ValidationError('Nome e slug são obrigatórios');
        }

        // Verificar se slug já existe
        const existing = await prisma.organization.findUnique({
            where: { slug },
        });

        if (existing) {
            throw new ValidationError('Slug já está em uso');
        }

        const organization = await prisma.organization.create({
            data: {
                name,
                slug: slug.toLowerCase(),
                email,
                phone,
                settings,
                isActive: true,
            },
        });

        return NextResponse.json(organization, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}

// PUT /api/organizations?id=xxx - Atualizar organização
export async function PUT(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            throw new ValidationError('ID é obrigatório');
        }

        // Verificar permissão
        if (!canAccessOrganization(user, id)) {
            throw new ValidationError('Sem permissão para editar esta organização');
        }

        const body = await request.json();

        // Super Admin pode editar tudo
        // Admin pode editar apenas alguns campos
        const allowedFields = user.role === 'SUPER_ADMIN'
            ? body
            : {
                name: body.name,
                email: body.email,
                phone: body.phone,
                settings: body.settings,
            };

        const organization = await prisma.organization.update({
            where: { id },
            data: allowedFields,
        });

        return NextResponse.json(organization);
    } catch (error) {
        return handleError(error);
    }
}

// DELETE /api/organizations?id=xxx - Deletar organização (Super Admin only)
export async function DELETE(request: NextRequest) {
    try {
        await requireSuperAdmin();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            throw new ValidationError('ID é obrigatório');
        }

        await prisma.organization.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
