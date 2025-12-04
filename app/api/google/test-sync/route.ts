import { NextRequest, NextResponse } from 'next/server';
import { syncCalendarEventsOrganization } from '@/app/services/googleCalendarService';

// GET - Test sync for debugging
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
        }

        console.log(`[TEST SYNC] Starting sync for organization: ${organizationId}`);

        const result = await syncCalendarEventsOrganization(organizationId, 30);

        console.log(`[TEST SYNC] Success! Synced ${result.syncedCount} events`);

        return NextResponse.json({
            success: true,
            message: `Successfully synced ${result.syncedCount} events`,
            ...result
        });
    } catch (error: any) {
        console.error('[TEST SYNC] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error',
            details: error.stack
        }, { status: 500 });
    }
}
