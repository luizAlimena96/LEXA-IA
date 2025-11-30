import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, canAccessOrganization } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';
import { triggerWebhook } from '@/app/services/crmService';

// GET /api/organizations/[id]/crm/webhooks - List webhooks
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();
        const orgId = params.id;

        if (!canAccessOrganization(user, orgId)) {
            throw new ValidationError('Sem permissão');
        }

        const webhooks = await prisma.crmWebhook.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(webhooks);
    } catch (error) {
        return handleError(error);
    }
}

// POST /api/organizations/[id]/crm/webhooks - Create webhook
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();
        const orgId = params.id;

        if (user.role !== 'SUPER_ADMIN' && !canAccessOrganization(user, orgId)) {
            throw new ValidationError('Sem permissão');
        }

        const body = await request.json();
        const { name, event, url, method, headers, bodyTemplate, isActive } = body;

        if (!name || !event || !url) {
            throw new ValidationError('Nome, evento e URL são obrigatórios');
        }

        const webhook = await prisma.crmWebhook.create({
            data: {
                organizationId: orgId,
                name,
                event,
                url,
                method: method || 'POST',
                headers,
                bodyTemplate,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json(webhook, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}

// PUT /api/organizations/[id]/crm/webhooks/[webhookId] - Update webhook
export async function PUT(
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

        if (user.role !== 'SUPER_ADMIN' && !canAccessOrganization(user, orgId)) {
            throw new ValidationError('Sem permissão');
        }

        const body = await request.json();

        const webhook = await prisma.crmWebhook.update({
            where: {
                id: webhookId,
                organizationId: orgId,
            },
            data: body,
        });

        return NextResponse.json(webhook);
    } catch (error) {
        return handleError(error);
    }
}

// DELETE /api/organizations/[id]/crm/webhooks/[webhookId] - Delete webhook
export async function DELETE(
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

        if (user.role !== 'SUPER_ADMIN' && !canAccessOrganization(user, orgId)) {
            throw new ValidationError('Sem permissão');
        }

        await prisma.crmWebhook.delete({
            where: {
                id: webhookId,
                organizationId: orgId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
