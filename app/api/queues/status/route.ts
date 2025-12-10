// API Route: GET /api/queues/status
// Returns status and statistics for all queues

import { NextRequest, NextResponse } from 'next/server';
import { getAllQueuesStats } from '@/app/lib/queues';

export async function GET(request: NextRequest) {
    try {
        const stats = await getAllQueuesStats();

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            queues: stats,
        });
    } catch (error) {
        console.error('[Queues API] Error getting queue stats:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
