import { NextRequest, NextResponse } from 'next/server';
import { syncCalendarEventsOrganization } from '@/app/services/googleCalendarService';

// POST - Sync calendar events from Google Calendar
export async function POST(request: NextRequest) {
    try {
        const { organizationId, daysAhead } = await request.json();

        if (!organizationId) {
            return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
        }
        const result = await syncCalendarEventsOrganization(organizationId, daysAhead || 30);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
