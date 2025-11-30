import { NextResponse } from 'next/server';
import { AppError } from './errors';
import { logError } from './logger';

/**
 * Global Error Handler
 * 
 * Trata todos os erros da aplicação de forma consistente
 */
export async function handleError(error: unknown, context?: {
    userId?: string;
    organizationId?: string;
    request?: any;
}) {
    console.error('Error caught:', error);

    // Log do erro no banco de dados
    await logError(error, context);

    // AppError customizado
    if (error instanceof AppError) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                code: error.code,
                details: error.details,
            },
            { status: error.statusCode }
        );
    }

    // Erro do Prisma
    if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as any;

        // Unique constraint violation
        if (prismaError.code === 'P2002') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Registro duplicado',
                    code: 'DUPLICATE_ENTRY',
                    field: prismaError.meta?.target?.[0],
                },
                { status: 409 }
            );
        }

        // Record not found
        if (prismaError.code === 'P2025') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Registro não encontrado',
                    code: 'NOT_FOUND'
                },
                { status: 404 }
            );
        }

        // Foreign key constraint failed
        if (prismaError.code === 'P2003') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Referência inválida',
                    code: 'INVALID_REFERENCE'
                },
                { status: 400 }
            );
        }
    }

    // Erro genérico
    return NextResponse.json(
        {
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR',
        },
        { status: 500 }
    );
}
