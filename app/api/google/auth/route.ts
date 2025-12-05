import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl, getAuthUrlForOrganization } from '@/app/services/googleCalendarService';

// GET - Generate Google OAuth URL
export async function GET(request: NextRequest) {
    try {
        console.log('🔵 Google Auth endpoint called');

        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');
        const organizationId = searchParams.get('organizationId');

        console.log('📋 Params:', { agentId, organizationId });

        // Validate environment variables
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
            console.error('❌ Missing Google OAuth environment variables');
            return NextResponse.json({
                error: 'Google Calendar integration not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI environment variables.'
            }, { status: 500 });
        }


        // Determine redirect URI from request origin
        const origin = request.nextUrl.origin;
        const redirectUri = `${origin}/api/google/callback`;
        console.log('🔗 Using redirect URI:', redirectUri);

        if (organizationId) {
            const cleanOrgId = organizationId.startsWith('org_')
                ? organizationId.substring(4)
                : organizationId;

            console.log('🏢 Generating auth URL for organization:', cleanOrgId);
            const authUrl = getAuthUrlForOrganization(cleanOrgId, redirectUri);
            console.log('✅ Auth URL generated successfully');
            console.log('🔗 Returning authUrl:', authUrl);
            return NextResponse.json({ authUrl });
        }

        if (agentId) {
            const authUrl = getAuthUrl(agentId, redirectUri);
            console.log('✅ Auth URL generated successfully');
            return NextResponse.json({ authUrl });
        }

        console.warn('⚠️ No agentId or organizationId provided');
        return NextResponse.json({ error: 'Agent ID or Organization ID required' }, { status: 400 });
    } catch (error) {
        console.error('❌ Error generating auth URL:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            error: 'Failed to generate authentication URL',
            details: errorMessage
        }, { status: 500 });
    }
}
