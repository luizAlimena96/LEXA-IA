import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';

// GET - Super Admin data endpoint
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Only SUPER_ADMIN can access
        if (session?.user?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');
        const type = searchParams.get('type');

        if (!orgId || !type) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        let data;

        switch (type) {
            case 'leads':
                data = await prisma.lead.findMany({
                    where: { organizationId: orgId },
                    orderBy: { createdAt: 'desc' },
                    take: 100,
                });
                break;

            case 'followups':
                data = await prisma.followup.findMany({
                    where: { organizationId: orgId },
                    orderBy: { createdAt: 'desc' },
                });
                break;

            case 'knowledge':
                data = await prisma.knowledge.findMany({
                    where: { organizationId: orgId },
                    orderBy: { createdAt: 'desc' },
                    take: 100,
                });
                break;

            case 'states':
                data = await prisma.state.findMany({
                    where: { organizationId: orgId },
                    orderBy: { order: 'asc' },
                });
                break;

            case 'appointments':
                data = await prisma.appointment.findMany({
                    where: { organizationId: orgId },
                    include: { lead: true },
                    orderBy: { scheduledAt: 'desc' },
                    take: 100,
                });
                break;

            case 'conversations':
                data = await prisma.conversation.findMany({
                    where: { organizationId: orgId },
                    include: {
                        lead: true,
                        _count: {
                            select: { messages: true },
                        },
                    },
                    orderBy: { updatedAt: 'desc' },
                    take: 100,
                });
                break;

            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching admin data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
