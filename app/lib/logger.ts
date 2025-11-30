import { prisma } from './prisma';

/**
 * Logging System
 * 
 * Sistema centralizado de logs com persistência no banco de dados
 */

export async function logError(
    error: unknown,
    context?: {
        userId?: string;
        organizationId?: string;
        request?: any;
    }
) {
    try {
        const errorObj = error as any;

        await prisma.errorLog.create({
            data: {
                level: 'ERROR',
                message: errorObj.message || String(error) || 'Unknown error',
                code: errorObj.code || errorObj.name || 'UNKNOWN',
                stack: errorObj.stack,
                context: context ? {
                    userId: context.userId,
                    organizationId: context.organizationId,
                    url: context.request?.url,
                    method: context.request?.method,
                    headers: context.request?.headers,
                    timestamp: new Date().toISOString(),
                } : {},
                userId: context?.userId,
                organizationId: context?.organizationId,
            },
        });
    } catch (logError) {
        // Fallback: log no console se não conseguir salvar no banco
        console.error('Failed to log error to database:', logError);
        console.error('Original error:', error);
    }
}

export async function logWarn(message: string, context?: any) {
    try {
        await prisma.errorLog.create({
            data: {
                level: 'WARN',
                message,
                context: context || {},
            },
        });
    } catch (error) {
        console.warn('Failed to log warning:', error);
        console.warn('Original message:', message);
    }
}

export async function logInfo(message: string, context?: any) {
    try {
        await prisma.errorLog.create({
            data: {
                level: 'INFO',
                message,
                context: context || {},
            },
        });
    } catch (error) {
        console.info('Failed to log info:', error);
        console.info('Original message:', message);
    }
}

export async function logDebug(message: string, context?: any) {
    try {
        await prisma.errorLog.create({
            data: {
                level: 'DEBUG',
                message,
                context: context || {},
            },
        });
    } catch (error) {
        console.debug('Failed to log debug:', error);
        console.debug('Original message:', message);
    }
}

/**
 * Buscar logs com filtros
 */
export async function getErrorLogs(filters: {
    level?: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
    organizationId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}) {
    const where: any = {};

    if (filters.level) where.level = filters.level;
    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.userId) where.userId = filters.userId;

    if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return await prisma.errorLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 100,
    });
}
