import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json(
                { error: 'Token e senha são obrigatórios' },
                { status: 400 }
            );
        }

        // Validar força da senha
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'A senha deve ter no mínimo 8 caracteres' },
                { status: 400 }
            );
        }

        // Buscar usuário pelo token
        const user = await prisma.user.findUnique({
            where: { resetToken: token },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Token inválido ou expirado' },
                { status: 400 }
            );
        }

        // Verificar se o token expirou
        if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
            // Limpar token expirado
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken: null,
                    resetTokenExpiry: null,
                },
            });

            return NextResponse.json(
                { error: 'Token expirado. Solicite um novo link de recuperação.' },
                { status: 400 }
            );
        }

        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Atualizar senha e remover token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        console.log(`[Reset Password] Password reset successful for user: ${user.email}`);

        return NextResponse.json({
            success: true,
            message: 'Senha redefinida com sucesso!',
        });
    } catch (error) {
        console.error('[Reset Password] Error:', error);
        return NextResponse.json(
            { error: 'Erro ao redefinir senha' },
            { status: 500 }
        );
    }
}
