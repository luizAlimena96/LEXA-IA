import { NextRequest, NextResponse } from 'next/server';
import { disconnectGoogleCalendar, disconnectGoogleCalendarOrganization } from '@/app/services/googleCalendarService';

// POST - Disconnect Google Calendar
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { agentId, organizationId } = body;

        // Support both agent-level and organization-level disconnect
        if (organizationId) {
            await disconnectGoogleCalendarOrganization(organizationId);
            return NextResponse.json({ success: true });
        }

        if (agentId) {
            await disconnectGoogleCalendar(agentId);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Agent ID or Organization ID required' }, { status: 400 });
    } catch (error) {
        console.error('Error disconnecting calendar:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
