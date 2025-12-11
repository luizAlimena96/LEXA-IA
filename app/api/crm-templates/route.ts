import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';

// GET: List templates (Public + Organization Private)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
        }

        const templates = await prisma.cRMTemplate.findMany({
            where: {
                OR: [
                    { isPublic: true },
                    { organizationId: organizationId }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(templates);
    } catch (error: any) {
        console.error('Error fetching templates:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new template from configuration
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, crmConfigId, organizationId } = body;

        if (!name || !crmConfigId || !organizationId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch original config with its automations
        const sourceConfig = await prisma.cRMConfig.findUnique({
            where: { id: crmConfigId },
            include: { automations: true }
        });

        if (!sourceConfig) {
            return NextResponse.json({ error: 'Source config not found' }, { status: 404 });
        }

        // Create template
        const template = await prisma.cRMTemplate.create({
            data: {
                name,
                description,
                crmType: sourceConfig.crmType,
                baseUrl: sourceConfig.baseUrl,
                authType: sourceConfig.authType,
                organizationId,
                isPublic: false, // Created by user = Private to org
                automations: JSON.stringify(sourceConfig.automations), // Store full automation array
            }
        });

        return NextResponse.json(template);
    } catch (error: any) {
        console.error('Error creating template:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a template
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
        }

        // Verify ownership (or admin status)
        const template = await prisma.cRMTemplate.findUnique({
            where: { id }
        });

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        // Only allow deleting own org templates (or if super admin, but simplified here)
        // AND not public templates (unless super admin, but again, simplified)
        if (template.organizationId !== session.user.organizationId && session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.cRMTemplate.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting template:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
