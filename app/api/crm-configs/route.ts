import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// GET - List all CRM configs for organization
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId') || user.organizationId;

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Organization ID is required' },
                { status: 400 }
            );
        }

        const crmConfigs = await prisma.cRMConfig.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { automations: true },
                },
            },
        });

        return NextResponse.json(crmConfigs);
    } catch (error: any) {
        console.error('Error fetching CRM configs:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Create new CRM config
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();

        const { organizationId, name, crmType, baseUrl, authType, apiKey } = body;

        if (!organizationId || !name || !crmType || !baseUrl || !authType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const crmConfig = await prisma.cRMConfig.create({
            data: {
                organizationId,
                name,
                crmType,
                baseUrl,
                authType,
                apiKey: apiKey || '',
                isActive: true,
            },
        });

        return NextResponse.json(crmConfig, { status: 201 });
    } catch (error: any) {
        console.error('Error creating CRM config:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
