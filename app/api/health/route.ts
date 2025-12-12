// Health Check Endpoint
// GET /api/health

import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
    const checks = {
        database: false,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    };

    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;
        checks.database = true;

        return NextResponse.json({
            status: 'healthy',
            checks
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: 'unhealthy',
                checks,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 503 }
        );
    }
}
