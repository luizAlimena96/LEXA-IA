import { NextRequest, NextResponse } from 'next/server';
import { getDebugLogs } from '@/app/services/debugService';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const filters = {
            phone: searchParams.get('phone') || undefined,
            conversationId: searchParams.get('conversationId') || undefined,
            organizationId: searchParams.get('organizationId') || undefined,
            startDate: searchParams.get('startDate')
                ? new Date(searchParams.get('startDate')!)
                : undefined,
            endDate: searchParams.get('endDate')
                ? new Date(searchParams.get('endDate')!)
                : undefined,
            limit: searchParams.get('limit')
                ? parseInt(searchParams.get('limit')!)
                : 50,
            offset: searchParams.get('offset')
                ? parseInt(searchParams.get('offset')!)
                : 0,
        };

        const result = await getDebugLogs(filters);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in debug logs API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch debug logs' },
            { status: 500 }
        );
    }
}
