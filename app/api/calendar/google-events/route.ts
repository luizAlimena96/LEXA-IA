import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET - Fetch synced Google Calendar events
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
        }

        // Fetch calendar events from database
        const events = await prisma.calendarEvent.findMany({
            where: {
                organizationId,
                startTime: {
                    gte: new Date(), // Only future events
                },
                status: {
                    not: 'cancelled',
                },
            },
            orderBy: {
                startTime: 'asc',
            },
            take: 100, // Limit to 100 events
        });

        return NextResponse.json(events);
    } catch (error: any) {
        console.error('Error fetching calendar events:', error);
        return NextResponse.json({
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
