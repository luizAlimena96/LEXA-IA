import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, canAccessOrganization } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';
import { getWebhookTemplate } from '@/app/services/crmService';

// GET /api/organizations/[id]/crm - Get CRM configuration
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id: orgId } = await params;

        if (!canAccessOrganization(user, orgId)) {
            throw new ValidationError('Sem permissão');
        }

        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                crmEnabled: true,
                crmType: true,
                crmWebhookUrl: true,
                crmAuthType: true,
                crmFieldMapping: true,
                crmWebhooks: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        return NextResponse.json(org);
    } catch (error) {
        return handleError(error);
    }
}

// PUT /api/organizations/[id]/crm - Update CRM configuration
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id: orgId } = await params;

        if (user.role !== 'SUPER_ADMIN' && !canAccessOrganization(user, orgId)) {
            throw new ValidationError('Sem permissão');
        }

        const body = await request.json();
        const { crmEnabled, crmType, crmWebhookUrl, crmAuthType, crmFieldMapping } = body;

        const org = await prisma.organization.update({
            where: { id: orgId },
            data: {
                crmEnabled,
                crmType,
                crmWebhookUrl,
                crmAuthType,
                crmFieldMapping,
            },
        });

        return NextResponse.json(org);
    } catch (error) {
        return handleError(error);
    }
}
