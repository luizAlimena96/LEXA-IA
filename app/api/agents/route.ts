import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, getOrganizationFilter, getOrganizationIdForCreate } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// GET /api/agents - List agents (filtered by organization)
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        // Filtro por organização
        const { searchParams } = new URL(request.url);
        const requestedOrgId = searchParams.get('organizationId');

        const orgFilter = getOrganizationFilter(user, requestedOrgId);

        const agents = await prisma.agent.findMany({
            where: orgFilter,
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        leads: true,
                        conversations: true,
                        knowledge: true,
                        states: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(agents);
    } catch (error) {
        return handleError(error, {
            userId: (await requireAuth().catch(() => null))?.id,
        });
    }
}

// POST /api/agents - Create new agent
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();

        const { name, description, tone, language, instance, organizationId } = body;

        // Validate required fields
        if (!name || !instance) {
            throw new ValidationError('Nome e instance são obrigatórios');
        }

        // Determinar organizationId
        const targetOrgId = getOrganizationIdForCreate(user, organizationId);

        // Check if instance already exists
        const existing = await prisma.agent.findUnique({
            where: { instance },
        });

        if (existing) {
            throw new ValidationError('Agente com esta instance já existe');
        }

        const agent = await prisma.agent.create({
            data: {
                name,
                description,
                tone: tone || 'FRIENDLY',
                language: language || 'pt-BR',
                instance,
                userId: user.id,
                organizationId: targetOrgId,
                isActive: true,
            },
            include: {
                organization: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(agent, { status: 201 });
    } catch (error) {
        return handleError(error, {
            userId: (await requireAuth().catch(() => null))?.id,
        });
    }
}
