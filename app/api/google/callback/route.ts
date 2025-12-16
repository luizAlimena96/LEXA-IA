import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/app/services/googleCalendarService';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code || !state) {
            return NextResponse.redirect(new URL('/perfil?error=oauth_failed', request.url));
        }

        // Exchange code for tokens
        const tokens = await getTokensFromCode(code);

        if (!tokens.refresh_token) {
            return NextResponse.redirect(new URL('/perfil?error=no_refresh_token', request.url));
        }

        // Save tokens to organization
        const organizationId = state.startsWith('org_') ? state.substring(4) : state;

        await prisma.organization.update({
            where: { id: organizationId },
            data: {
                googleRefreshToken: tokens.refresh_token,
                googleAccessToken: tokens.access_token,
            },
        });

        return NextResponse.redirect(
            new URL(`/perfil?success=calendar_connected&organizationId=${organizationId}`, request.url)
        );
    } catch (error) {
        console.error('[Google Callback] Error:', error);
        return NextResponse.redirect(new URL('/perfil?error=oauth_failed', request.url));
    }
}
