import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/app/services/googleCalendarService';

// GET - OAuth callback
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // agentId

        if (!code || !state) {
            return NextResponse.redirect('/perfil?error=oauth_failed');
        }

        await exchangeCodeForTokens(code, state);

        return NextResponse.redirect('/perfil?success=calendar_connected');
    } catch (error) {
        console.error('Error in OAuth callback:', error);
        return NextResponse.redirect('/perfil?error=oauth_failed');
    }
}
