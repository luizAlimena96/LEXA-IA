import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkAllConnections } from '@/app/services/whatsappMonitoringService';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        console.log('[WhatsApp Monitoring API] Manual trigger by:', session.user.email);

        const result = await checkAllConnections();

        return NextResponse.json({
            success: true,
            message: 'Monitoring check completed',
            ...result,
        });
    } catch (error) {
        console.error('[WhatsApp Monitoring API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to check connections' },
            { status: 500 }
        );
    }
}
