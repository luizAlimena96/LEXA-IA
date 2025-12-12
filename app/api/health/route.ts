// Health Check Endpoint
// GET /api/health

import { NextResponse } from 'next/server';
import { checkDatabaseConnections } from '@/app/lib/db-monitor';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
    try {
        // Check database connection with latency
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const dbLatency = Date.now() - dbStart;

        // Get connection stats
        const connectionStats = await checkDatabaseConnections();

        // Check if database is healthy
        const dbHealthy = dbLatency < 1000; // < 1 segundo
        const connectionsHealthy = connectionStats
            ? connectionStats.total_connections < 12 // < 12 conexões (80% do limite)
            : false;

        const isHealthy = dbHealthy && connectionsHealthy;

        return NextResponse.json({
            status: isHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            checks: {
                database: {
                    status: dbHealthy ? 'ok' : 'slow',
                    latency_ms: dbLatency,
                },
                connections: {
                    status: connectionsHealthy ? 'ok' : 'high',
                    total: connectionStats?.total_connections || 0,
                    active: connectionStats?.active_connections || 0,
                    idle: connectionStats?.idle_connections || 0,
                    limit: 15,
                },
            },
            uptime: process.uptime(),
            memory: {
                used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            },
            environment: process.env.NODE_ENV || 'development',
        }, {
            status: isHealthy ? 200 : 503,
        });
    } catch (error) {
        console.error('[Health Check] Error:', error);
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
        }, {
            status: 503,
        });
    }
}
