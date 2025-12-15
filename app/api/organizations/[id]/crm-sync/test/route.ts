// API Route: Test CRM Connection

import { NextRequest, NextResponse } from 'next/server';
import { testCRMConnection } from '@/app/services/crmCalendarSyncService';

export async function POST(request: NextRequest) {
    try {
        // Authentication handled by backend
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { apiUrl, apiKey } = body;

        if (!apiUrl) {
            return NextResponse.json({ error: 'API URL is required' }, { status: 400 });
        }

        const result = await testCRMConnection(apiUrl, apiKey);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error testing CRM connection:', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}
