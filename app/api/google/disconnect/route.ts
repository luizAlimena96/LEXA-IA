import { NextRequest, NextResponse } from 'next/server';
import { disconnectGoogleCalendar } from '@/app/services/googleCalendarService';

// POST - Disconnect Google Calendar
export async function POST(request: NextRequest) {
    try {
        const { agentId } = await request.json();

        if (!agentId) {
            return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
        }

        await disconnectGoogleCalendar(agentId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error disconnecting calendar:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
