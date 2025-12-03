import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

/**
 * API Helper para diagnosticar problemas de organização
 * GET /api/debug/user-org
 */
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        // Buscar dados completos do usuário
        const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                organization: true,
            },
        });

        // Listar todas as organizações
        const organizations = await prisma.organization.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
            },
        });

        return NextResponse.json({
            sessionUser: user,
            databaseUser: fullUser,
            availableOrganizations: organizations,
            diagnosis: {
                hasOrganizationInSession: !!user.organizationId,
                hasOrganizationInDatabase: !!fullUser?.organizationId,
                organizationMatch: user.organizationId === fullUser?.organizationId,
                needsUpdate: !fullUser?.organizationId && organizations.length > 0,
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/debug/user-org
 * Atualiza a organização do usuário
 */
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { organizationId } = await request.json();

        if (!organizationId) {
            return NextResponse.json(
                { error: 'organizationId é obrigatório' },
                { status: 400 }
            );
        }

        // Verificar se a organização existe
        const org = await prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!org) {
            return NextResponse.json(
                { error: 'Organização não encontrada' },
                { status: 404 }
            );
        }

        // Atualizar usuário
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { organizationId },
            include: { organization: true },
        });

        return NextResponse.json({
            success: true,
            message: `Usuário associado à organização: ${org.name}`,
            user: updatedUser,
            nextSteps: 'Por favor, faça logout e login novamente para atualizar a sessão.',
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
