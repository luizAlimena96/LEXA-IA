import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, exchangeCodeForTokensOrganization } from '@/app/services/googleCalendarService';

// GET - OAuth callback
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // agentId or org_organizationId

        if (!code || !state) {
            return NextResponse.redirect(new URL('/perfil?error=oauth_failed', request.url));
        }

        // Check if this is organization-level OAuth (state starts with 'org_')
        if (state.startsWith('org_')) {
            const organizationId = state.substring(4); // Remove 'org_' prefix
            await exchangeCodeForTokensOrganization(code, organizationId);
            return NextResponse.redirect(new URL('/perfil?success=calendar_connected', request.url));
        }

        // Agent-level OAuth (backward compatibility)
        await exchangeCodeForTokens(code, state);
        return NextResponse.redirect(new URL('/perfil?success=calendar_connected', request.url));
    } catch (error) {
        console.error('Error in OAuth callback:', error);
        return NextResponse.redirect(new URL('/perfil?error=oauth_failed', request.url));
    }
}
