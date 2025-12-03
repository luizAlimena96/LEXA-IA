import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

/**
 * API para Super Admin assumir temporariamente uma organização
 * POST /api/admin/assume-organization
 */
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();

        // Apenas Super Admins podem usar esta API
        if (user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Acesso negado. Apenas Super Admins.' },
                { status: 403 }
            );
        }

        const { organizationId } = await request.json();

        // Se organizationId for null ou vazio, remove a associação
        if (!organizationId) {
            await prisma.user.update({
                where: { id: user.id },
                data: { organizationId: null },
            });

            return NextResponse.json({
                success: true,
                message: 'Organização removida. Visualizando todas as organizações.',
                organizationId: null,
            });
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

        // Atualizar o organizationId do Super Admin temporariamente
        await prisma.user.update({
            where: { id: user.id },
            data: { organizationId },
        });

        return NextResponse.json({
            success: true,
            message: `Agora trabalhando como: ${org.name}`,
            organizationId: org.id,
            organizationName: org.name,
        });
    } catch (error: any) {
        console.error('Error assuming organization:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
