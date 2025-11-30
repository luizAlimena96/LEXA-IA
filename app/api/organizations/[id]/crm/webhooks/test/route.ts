import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, canAccessOrganization } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';
import { triggerWebhook } from '@/app/services/crmService';

// POST /api/organizations/[id]/crm/webhooks/test - Test webhook
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();
        const orgId = params.id;
        const { searchParams } = new URL(request.url);
        const webhookId = searchParams.get('webhookId');

        if (!webhookId) {
            throw new ValidationError('Webhook ID é obrigatório');
        }

        if (!canAccessOrganization(user, orgId)) {
            throw new ValidationError('Sem permissão');
        }

        const webhook = await prisma.crmWebhook.findFirst({
            where: {
                id: webhookId,
                organizationId: orgId,
            },
        });

        if (!webhook) {
            throw new ValidationError('Webhook não encontrado');
        }

        // Create test payload
        const testPayload = {
            lead: {
                name: 'Teste Lead',
                email: 'teste@example.com',
                phone: '5511999999999',
                source: 'WhatsApp',
                status: 'NEW',
                notes: 'Lead de teste',
            },
            conversation: {
                status: 'IN_PROGRESS',
            },
            event: webhook.event,
            timestamp: new Date(),
            organizationId: orgId,
        };

        // Trigger webhook
        const result = await triggerWebhook(webhook, testPayload);

        return NextResponse.json(result);
    } catch (error) {
        return handleError(error);
    }
}
