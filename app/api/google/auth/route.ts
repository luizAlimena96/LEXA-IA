import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl, getAuthUrlForOrganization } from '@/app/services/googleCalendarService';

// GET - Generate Google OAuth URL
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');
        const organizationId = searchParams.get('organizationId');

        // Support both agent-level and organization-level OAuth
        if (organizationId) {
            const authUrl = getAuthUrlForOrganization(organizationId);
            return NextResponse.json({ authUrl });
        }

        if (agentId) {
            const authUrl = getAuthUrl(agentId);
            return NextResponse.json({ authUrl });
        }

        return NextResponse.json({ error: 'Agent ID or Organization ID required' }, { status: 400 });
    } catch (error) {
        console.error('Error generating auth URL:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
