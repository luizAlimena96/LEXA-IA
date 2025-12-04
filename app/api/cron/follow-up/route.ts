import { NextRequest, NextResponse } from 'next/server';
import { checkAgentFollowUps } from '@/app/services/agentFollowupService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const processedCount = await checkAgentFollowUps();
        return NextResponse.json({ success: true, processed: processedCount });
    } catch (error) {
        console.error('Error in cron/follow-up:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
