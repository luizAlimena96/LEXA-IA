// API Route: Test CRM Connection

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { testCRMConnection } from '@/app/services/crmCalendarSyncService';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
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
