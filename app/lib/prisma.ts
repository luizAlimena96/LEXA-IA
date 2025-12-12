import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Configuração otimizada para evitar MaxClientsInSessionMode com PgBouncer/Supabase
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: [
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
        ...(process.env.ENABLE_QUERY_LOGGING === 'true'
            ? [{ level: 'query' as const, emit: 'event' as const }]
            : []
        ),
    ],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
})

// Query logging para monitoramento em produção
if (process.env.ENABLE_QUERY_LOGGING === 'true') {
    prisma.$on('query' as never, ((e: any) => {
        console.log(`[Prisma Query] ${e.query} - Duration: ${e.duration}ms`);
    }) as never);
}

// Sempre reutilizar a instância para evitar criar múltiplas conexões
globalForPrisma.prisma = prisma

// Graceful shutdown
process.on('beforeExit', async () => {
    console.log('[Prisma] Disconnecting from database...');
    await prisma.$disconnect()
    console.log('[Prisma] ✅ Disconnected successfully');
})
