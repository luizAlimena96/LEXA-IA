import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, canAccessOrganization } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// GET /api/organizations/[id]/crm/logs - Get webhook logs
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id: orgId } = await params;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const webhookId = searchParams.get('webhookId');

        if (!canAccessOrganization(user, orgId)) {
            throw new ValidationError('Sem permissão');
        }

        // Get webhooks for this organization
        const webhooks = await prisma.crmWebhook.findMany({
            where: { organizationId: orgId },
            select: { id: true },
        });

        const webhookIds = webhooks.map(w => w.id);

        // Build where clause
        const where: any = {
            webhookId: { in: webhookIds },
        };

        if (webhookId) {
            where.webhookId = webhookId;
        }

        const logs = await prisma.crmWebhookLog.findMany({
            where,
            include: {
                webhook: {
                    select: {
                        name: true,
                        event: true,
                        url: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return NextResponse.json(logs);
    } catch (error) {
        return handleError(error);
    }
}
