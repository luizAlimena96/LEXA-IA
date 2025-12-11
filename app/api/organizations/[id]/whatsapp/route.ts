import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';
import { generateQRCode, checkConnectionStatus, disconnectInstance } from '@/app/services/evolutionService';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id: orgId } = await params;
        const body = await request.json();
        const { alertPhone1, alertPhone2 } = body;

        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== orgId) {
            throw new ValidationError('Sem permissão');
        }

        const org = await prisma.organization.findUnique({
            where: { id: orgId },
        });

        if (!org) {
            throw new ValidationError('Organização não encontrada');
        }

        if (!org.evolutionApiUrl || !org.evolutionApiKey || !org.evolutionInstanceName) {
            throw new ValidationError('Configuração Evolution API incompleta');
        }

        const qrCode = await generateQRCode({
            apiUrl: org.evolutionApiUrl,
            apiKey: org.evolutionApiKey,
            instanceName: org.evolutionInstanceName,
        });

        // Get LEXA number from env
        const lexaNumber = process.env.LEXA_WHATSAPP_NUMBER || '';

        // Save QR Code and alert phones
        // alertPhone1 = Company phone (from request)
        // alertPhone2 = LEXA number (automatic, for support)
        await prisma.organization.update({
            where: { id: orgId },
            data: {
                whatsappQrCode: qrCode,
                whatsappAlertPhone1: alertPhone1 || null,
                whatsappAlertPhone2: lexaNumber || null, // LEXA always receives alerts
                whatsappMonitoringEnabled: true,
            },
        });

        return NextResponse.json({ qrCode });
    } catch (error) {
        return handleError(error);
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id: orgId } = await params;

        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== orgId) {
            throw new ValidationError('Sem permissão');
        }

        const org = await prisma.organization.findUnique({
            where: { id: orgId },
        });

        if (!org || !org.evolutionApiUrl || !org.evolutionApiKey || !org.evolutionInstanceName) {
            return NextResponse.json({ connected: false });
        }

        const status = await checkConnectionStatus({
            apiUrl: org.evolutionApiUrl,
            apiKey: org.evolutionApiKey,
            instanceName: org.evolutionInstanceName,
        });

        if (status.connected && !org.whatsappConnected) {
            await prisma.organization.update({
                where: { id: orgId },
                data: {
                    whatsappConnected: true,
                    whatsappPhone: status.phone,
                    whatsappConnectedAt: new Date(),
                    whatsappLastConnected: new Date(),
                    whatsappQrCode: null,
                },
            });
        }

        return NextResponse.json({
            ...status,
            alertPhone1: org.whatsappAlertPhone1,
            alertPhone2: org.whatsappAlertPhone2,
            monitoringEnabled: org.whatsappMonitoringEnabled,
            lastConnected: org.whatsappLastConnected,
            lastDisconnected: org.whatsappLastDisconnected,
        });
    } catch (error) {
        return handleError(error);
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id: orgId } = await params;

        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== orgId) {
            throw new ValidationError('Sem permissão');
        }

        const org = await prisma.organization.findUnique({
            where: { id: orgId },
        });

        if (!org || !org.evolutionApiUrl || !org.evolutionApiKey || !org.evolutionInstanceName) {
            throw new ValidationError('Configuração não encontrada');
        }

        await disconnectInstance({
            apiUrl: org.evolutionApiUrl,
            apiKey: org.evolutionApiKey,
            instanceName: org.evolutionInstanceName,
        });

        await prisma.organization.update({
            where: { id: orgId },
            data: {
                whatsappConnected: false,
                whatsappPhone: null,
                whatsappQrCode: null,
                whatsappConnectedAt: null,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
