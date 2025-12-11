import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Configuração otimizada para evitar MaxClientsInSessionMode com PgBouncer/Supabase
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
})

// Sempre reutilizar a instância para evitar criar múltiplas conexões
globalForPrisma.prisma = prisma

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect()
})
