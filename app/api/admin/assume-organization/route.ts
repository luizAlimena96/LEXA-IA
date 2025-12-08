import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();

        if (user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Acesso negado. Apenas Super Admins.' },
                { status: 403 }
            );
        }

        // Verificar se o usuário existe no banco de dados
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!dbUser) {
            return NextResponse.json(
                { error: 'Usuário não encontrado no banco de dados. Por favor, faça login novamente.' },
                { status: 404 }
            );
        }

        const { organizationId } = await request.json();

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

        const org = await prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!org) {
            return NextResponse.json(
                { error: 'Organização não encontrada' },
                { status: 404 }
            );
        }

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
