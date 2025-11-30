import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/app/services/googleCalendarService';

// GET - Generate Google OAuth URL
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');

        if (!agentId) {
            return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
        }

        const authUrl = getAuthUrl(agentId);

        return NextResponse.json({ authUrl });
    } catch (error) {
        console.error('Error generating auth URL:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
