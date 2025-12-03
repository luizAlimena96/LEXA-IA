import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, canAccessOrganization } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError, NotFoundError } from '@/app/lib/errors';

// GET /api/organizations/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        if (!canAccessOrganization(user, id)) {
            throw new ValidationError('Sem permissão para acessar esta organização');
        }

        const organization = await prisma.organization.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        image: true,
                        allowedTabs: true,
                    }
                }
            }
        });

        if (!organization) {
            throw new NotFoundError('Organização não encontrada');
        }

        return NextResponse.json(organization);
    } catch (error) {
        return handleError(error);
    }
}

// PATCH /api/organizations/[id]
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;
        const body = await request.json();

        if (!canAccessOrganization(user, id)) {
            throw new ValidationError('Sem permissão para editar esta organização');
        }

        // Fields allowed to be updated
        const allowedFields = [
            'name', 'email', 'phone', 'niche', 'document',
            'zipCode', 'street', 'number', 'neighborhood', 'city', 'state',
            'crmType', 'crmEnabled', 'crmWebhookUrl', 'crmApiKey', 'crmAuthType', 'crmFieldMapping',
            'openaiApiKey', 'openaiModel',
            'elevenLabsApiKey', 'elevenLabsVoiceId', 'elevenLabsModel',
            'evolutionApiUrl', 'evolutionApiKey', 'evolutionInstanceName',
            'zapSignApiToken', 'zapSignTemplateId', 'zapSignEnabled'
        ];

        const dataToUpdate: any = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                dataToUpdate[field] = body[field];
            }
        }

        const organization = await prisma.organization.update({
            where: { id },
            data: dataToUpdate,
        });

        return NextResponse.json(organization);
    } catch (error) {
        return handleError(error);
    }
}
