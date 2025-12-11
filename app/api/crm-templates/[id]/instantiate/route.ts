import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const templateId = params.id;
        const body = await request.json();
        const { organizationId, name, apiKey } = body;

        if (!organizationId || !name || !apiKey) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch template
        const template = await prisma.cRMTemplate.findUnique({
            where: { id: templateId }
        });

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        // Create Config
        const newConfig = await prisma.cRMConfig.create({
            data: {
                organizationId,
                name,
                crmType: template.crmType,
                baseUrl: template.baseUrl,
                authType: template.authType,
                apiKey, // The new API Key provided by user
                isActive: true
            }
        });

        // Create Automations
        const automationsData = typeof template.automations === 'string'
            ? JSON.parse(template.automations)
            : template.automations;

        if (Array.isArray(automationsData)) {
            for (const auto of automationsData) {
                // Ensure unique ID is generated, not copied
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id, crmConfigId, createdAt, updatedAt, ...autoData } = auto;

                await prisma.cRMAutomation.create({
                    data: {
                        ...autoData,
                        crmConfigId: newConfig.id
                    }
                });
            }
        }

        return NextResponse.json(newConfig);

    } catch (error: any) {
        console.error('Error instantiating template:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
