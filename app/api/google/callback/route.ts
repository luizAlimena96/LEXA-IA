import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, exchangeCodeForTokensOrganization } from '@/app/services/googleCalendarService';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        if (!code || !state) {
            return NextResponse.redirect(new URL('/perfil?error=oauth_failed', request.url));
        }
        // Determine redirect URI from request origin
        const origin = request.nextUrl.origin;
        const redirectUri = `${origin}/api/google/callback`;

        if (state.startsWith('org_')) {
            const organizationId = state.substring(4);
            await exchangeCodeForTokensOrganization(code, organizationId, redirectUri);
            return NextResponse.redirect(new URL(`/perfil?success=calendar_connected&organizationId=${organizationId}`, request.url));
        }
        await exchangeCodeForTokens(code, state, redirectUri);
        const agent = await prisma.agent.findUnique({
            where: { id: state },
            select: { organizationId: true }
        });
        if (agent?.organizationId) {
            return NextResponse.redirect(new URL(`/perfil?success=calendar_connected&organizationId=${agent.organizationId}`, request.url));
        }
        return NextResponse.redirect(new URL('/perfil?success=calendar_connected', request.url));
    } catch (error) {
        return NextResponse.redirect(new URL('/perfil?error=oauth_failed', request.url));
    }
}
