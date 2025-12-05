import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';

// GET /api/dashboard/activities
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('organizationId');

        const organizationId = user.role === 'SUPER_ADMIN' && orgId ? orgId : user.organizationId;
        if (!organizationId) {
            return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
        }

        // Get recent leads
        const recentLeads = await prisma.lead.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                name: true,
                status: true,
                createdAt: true,
            },
        });

        const activities = recentLeads.map((lead: typeof recentLeads[0]) => ({
            id: lead.id,
            type: 'lead' as const,
            title: `Novo lead: ${lead.name || 'Sem nome'}`,
            description: `Status: ${lead.status}`,
            time: new Date(lead.createdAt).toLocaleString('pt-BR'),
        }));

        return NextResponse.json(activities);
    } catch (error) {
        return handleError(error);
    }
}
