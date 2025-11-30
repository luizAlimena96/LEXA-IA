import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';

// GET /api/dashboard/performance
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        // TODO: Calculate from real data
        const performance = {
            messagesPerDay: [12, 19, 15, 25, 22, 30, 28],
            conversionsPerWeek: [3, 5, 4, 7],
            responseTimeAvg: 5,
        };

        return NextResponse.json(performance);
    } catch (error) {
        return handleError(error);
    }
}
