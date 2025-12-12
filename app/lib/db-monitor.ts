import { prisma } from './prisma';

/**
 * Database Connection Monitor
 * Monitora conexões ativas do PostgreSQL/Supabase
 */

interface ConnectionStats {
    total_connections: number;
    active_connections: number;
    idle_connections: number;
    timestamp: Date;
}

/**
 * Verifica o número de conexões ativas no banco de dados
 */
export async function checkDatabaseConnections(): Promise<ConnectionStats | null> {
    try {
        const result = await prisma.$queryRaw<Array<{
            total: bigint;
            active: bigint;
            idle: bigint;
        }>>`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE state = 'active') as active,
                COUNT(*) FILTER (WHERE state = 'idle') as idle
            FROM pg_stat_activity 
            WHERE datname = current_database()
        `;

        if (result && result.length > 0) {
            const stats: ConnectionStats = {
                total_connections: Number(result[0].total),
                active_connections: Number(result[0].active),
                idle_connections: Number(result[0].idle),
                timestamp: new Date(),
            };

            console.log('[DB Monitor] Connection Stats:', {
                total: stats.total_connections,
                active: stats.active_connections,
                idle: stats.idle_connections,
            });

            // Alerta se conexões estiverem muito altas
            // Para PostgreSQL local com PgBouncer: limite de 5 conexões
            // Para Supabase sem pooler: limite de 15 conexões
            const MAX_CONNECTIONS = process.env.DATABASE_URL?.includes('6432') ? 5 : 15;
            const CONNECTION_TYPE = process.env.DATABASE_URL?.includes('6432') ? 'PgBouncer' : 'Direct PostgreSQL';

            if (stats.total_connections > MAX_CONNECTIONS - 2) {
                console.warn(`[DB Monitor] ⚠️  High connection count: ${stats.total_connections}/${MAX_CONNECTIONS} (${CONNECTION_TYPE} limit)`);
            }

            return stats;
        }

        return null;
    } catch (error) {
        console.error('[DB Monitor] Error checking connections:', error);
        return null;
    }
}

/**
 * Verifica queries lentas (> 5 segundos)
 */
export async function checkSlowQueries() {
    try {
        const result = await prisma.$queryRaw<Array<{
            pid: number;
            duration: string;
            query: string;
            state: string;
        }>>`
            SELECT 
                pid,
                now() - query_start as duration,
                query,
                state
            FROM pg_stat_activity
            WHERE state != 'idle'
            AND now() - query_start > interval '5 seconds'
            AND datname = current_database()
            ORDER BY duration DESC
            LIMIT 5
        `;

        if (result && result.length > 0) {
            console.warn('[DB Monitor] ⚠️  Slow queries detected:', result.length);
            result.forEach((query, index) => {
                console.warn(`[DB Monitor] Slow Query ${index + 1}:`, {
                    pid: query.pid,
                    duration: query.duration,
                    query: query.query.substring(0, 100) + '...',
                });
            });
        }

        return result;
    } catch (error) {
        console.error('[DB Monitor] Error checking slow queries:', error);
        return [];
    }
}

/**
 * Inicia monitoramento periódico de conexões
 * Executa a cada 2 minutos
 */
let monitoringInterval: NodeJS.Timeout | null = null;

export function startDatabaseMonitoring() {
    if (monitoringInterval) {
        console.log('[DB Monitor] Monitoring already running');
        return;
    }

    console.log('[DB Monitor] Starting database connection monitoring...');

    // Primeira verificação imediata
    checkDatabaseConnections();

    // Verificações periódicas a cada 2 minutos
    monitoringInterval = setInterval(async () => {
        await checkDatabaseConnections();
        await checkSlowQueries();
    }, 2 * 60 * 1000); // 2 minutos

    console.log('[DB Monitor] ✅ Monitoring started (interval: 2 minutes)');
}

/**
 * Para o monitoramento
 */
export function stopDatabaseMonitoring() {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
        console.log('[DB Monitor] ✅ Monitoring stopped');
    }
}

/**
 * Força desconexão de todas as conexões idle
 * USAR COM CUIDADO - apenas em emergências
 */
export async function killIdleConnections() {
    try {
        const result = await prisma.$executeRaw`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = current_database()
            AND state = 'idle'
            AND state_change < now() - interval '5 minutes'
        `;

        console.log('[DB Monitor] ✅ Killed idle connections:', result);
        return result;
    } catch (error) {
        console.error('[DB Monitor] Error killing idle connections:', error);
        return 0;
    }
}
