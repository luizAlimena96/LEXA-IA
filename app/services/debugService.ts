import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateDebugLogInput {
    phone: string;
    conversationId?: string;
    clientMessage: string;
    aiResponse: string;
    currentState?: string;
    aiThinking?: string;
    organizationId?: string;
    agentId?: string;
    leadId?: string;
}

export interface DebugLogFilters {
    phone?: string;
    conversationId?: string;
    organizationId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}

/**
 * Create a debug log entry
 */
export async function createDebugLog(data: CreateDebugLogInput) {
    try {
        const debugLog = await prisma.debugLog.create({
            data: {
                phone: data.phone,
                conversationId: data.conversationId,
                clientMessage: data.clientMessage,
                aiResponse: data.aiResponse,
                currentState: data.currentState,
                aiThinking: data.aiThinking,
                organizationId: data.organizationId,
                agentId: data.agentId,
                leadId: data.leadId,
            },
        });

        return debugLog;
    } catch (error) {
        console.error('Error creating debug log:', error);
        throw error;
    }
}

/**
 * Get debug logs with filters
 */
export async function getDebugLogs(filters: DebugLogFilters = {}) {
    try {
        const where: any = {};

        if (filters.phone) {
            where.phone = filters.phone;
        }

        if (filters.conversationId) {
            where.conversationId = filters.conversationId;
        }

        if (filters.organizationId) {
            where.organizationId = filters.organizationId;
        }

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.createdAt.lte = filters.endDate;
            }
        }

        const debugLogs = await prisma.debugLog.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
            take: filters.limit || 50,
            skip: filters.offset || 0,
        });

        const total = await prisma.debugLog.count({ where });

        return {
            data: debugLogs,
            total,
            limit: filters.limit || 50,
            offset: filters.offset || 0,
        };
    } catch (error) {
        console.error('Error fetching debug logs:', error);
        throw error;
    }
}

/**
 * Get debug logs for a specific conversation
 */
export async function getConversationDebugLogs(conversationId: string) {
    try {
        const debugLogs = await prisma.debugLog.findMany({
            where: {
                conversationId,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return debugLogs;
    } catch (error) {
        console.error('Error fetching conversation debug logs:', error);
        throw error;
    }
}

/**
 * Delete old debug logs (cleanup)
 */
export async function cleanupOldDebugLogs(daysToKeep: number = 30) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const result = await prisma.debugLog.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
            },
        });

        return result.count;
    } catch (error) {
        console.error('Error cleaning up debug logs:', error);
        throw error;
    }
}
