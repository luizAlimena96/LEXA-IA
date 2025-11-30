// API Route: CRM Calendar Sync Configuration

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';
import { syncCRMCalendar, testCRMConnection } from '@/app/services/crmCalendarSyncService';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: orgId } = await params;

        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                id: true,
                name: true,
                crmCalendarSyncEnabled: true,
                crmCalendarApiUrl: true,
                crmCalendarApiKey: true,
                crmCalendarSyncInterval: true,
                crmCalendarType: true,
                appointmentWebhookUrl: true,
                appointmentWebhookEnabled: true,
            }
        });

        if (!org) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        // Não retornar API Key completa por segurança
        return NextResponse.json({
            ...org,
            crmCalendarApiKey: org.crmCalendarApiKey ? '***' : null
        });
    } catch (error) {
        console.error('Error fetching CRM sync config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: orgId } = await params;
        const body = await request.json();

        const updateData: any = {
            crmCalendarSyncEnabled: body.crmCalendarSyncEnabled,
            crmCalendarApiUrl: body.crmCalendarApiUrl,
            crmCalendarSyncInterval: body.crmCalendarSyncInterval,
            crmCalendarType: body.crmCalendarType,
            appointmentWebhookUrl: body.appointmentWebhookUrl,
            appointmentWebhookEnabled: body.appointmentWebhookEnabled,
        };

        // Só atualizar API Key se foi fornecida
        if (body.crmCalendarApiKey && body.crmCalendarApiKey !== '***') {
            updateData.crmCalendarApiKey = body.crmCalendarApiKey;
        }

        const org = await prisma.organization.update({
            where: { id: orgId },
            data: updateData,
            select: {
                id: true,
                name: true,
                crmCalendarSyncEnabled: true,
                crmCalendarApiUrl: true,
                crmCalendarSyncInterval: true,
                crmCalendarType: true,
                appointmentWebhookUrl: true,
                appointmentWebhookEnabled: true,
            }
        });

        return NextResponse.json(org);
    } catch (error) {
        console.error('Error updating CRM sync config:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Sincronizar agora (manual)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: orgId } = await params;

        await syncCRMCalendar(orgId);

        return NextResponse.json({ success: true, message: 'Sincronização iniciada' });
    } catch (error: any) {
        console.error('Error syncing CRM calendar:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
