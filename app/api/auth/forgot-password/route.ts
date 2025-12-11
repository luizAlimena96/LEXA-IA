import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { sendPasswordResetEmail } from '@/app/services/emailService';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email é obrigatório' },
                { status: 400 }
            );
        }

        // Buscar usuário por email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        // Por segurança, sempre retornar sucesso mesmo se o email não existir
        // Isso evita que atacantes descubram quais emails estão cadastrados
        if (!user) {
            console.log(`[Forgot Password] Email not found: ${email}`);
            return NextResponse.json({
                success: true,
                message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.',
            });
        }

        // Gerar token único
        const resetToken = crypto.randomUUID();

        // Definir expiração para 1 hora a partir de agora
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        // Salvar token no banco
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        // Construir link de reset
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/redefinir-senha?token=${resetToken}`;

        // Enviar email
        const emailResult = await sendPasswordResetEmail({
            email: user.email,
            resetLink,
            userName: user.name,
        });

        if (!emailResult.success) {
            console.error('[Forgot Password] Failed to send email:', emailResult.error);
            return NextResponse.json(
                { error: 'Erro ao enviar email. Tente novamente mais tarde.' },
                { status: 500 }
            );
        }

        console.log(`[Forgot Password] Reset email sent to: ${user.email}`);

        return NextResponse.json({
            success: true,
            message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.',
        });
    } catch (error) {
        console.error('[Forgot Password] Error:', error);
        return NextResponse.json(
            { error: 'Erro ao processar solicitação' },
            { status: 500 }
        );
    }
}
