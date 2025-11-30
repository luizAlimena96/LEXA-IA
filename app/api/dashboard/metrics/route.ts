import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';

// GET /api/dashboard/metrics
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('organizationId');

        const organizationId = user.role === 'SUPER_ADMIN' && orgId
            ? orgId
            : user.organizationId;

        if (!organizationId) {
            return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
        }

        // Get total leads
        const totalLeads = await prisma.lead.count({
            where: { organizationId },
        });

        // Get active conversations
        const activeConversations = await prisma.conversation.count({
            where: { organizationId },
        });

        // Get leads by status
        const leadsByStatus = await prisma.lead.groupBy({
            by: ['status'],
            where: { organizationId },
            _count: true,
        });

        const statusCounts = {
            NEW: 0,
            CONTACTED: 0,
            QUALIFIED: 0,
            PROPOSAL_SENT: 0,
            WON: 0,
            LOST: 0,
        };

        leadsByStatus.forEach((item: any) => {
            statusCounts[item.status as keyof typeof statusCounts] = item._count;
        });

        // Get leads today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const leadsToday = await prisma.lead.count({
            where: {
                organizationId,
                createdAt: { gte: today },
            },
        });

        // Get leads this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const leadsThisWeek = await prisma.lead.count({
            where: {
                organizationId,
                createdAt: { gte: weekAgo },
            },
        });

        // Get leads this month
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        const leadsThisMonth = await prisma.lead.count({
            where: {
                organizationId,
                createdAt: { gte: monthAgo },
            },
        });

        // Calculate conversion rate
        const wonLeads = statusCounts.WON;
        const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

        const metrics = {
            totalLeads,
            activeConversations,
            conversionRate: Math.round(conversionRate * 10) / 10,
            avgResponseTime: '5min', // TODO: Calculate from messages
            leadsToday,
            leadsThisWeek,
            leadsThisMonth,
            leadsByStatus: statusCounts,
        };

        return NextResponse.json(metrics);
    } catch (error) {
        return handleError(error);
    }
}
