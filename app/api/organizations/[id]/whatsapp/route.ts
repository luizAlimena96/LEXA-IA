import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';
import { generateQRCode, checkConnectionStatus, disconnectInstance } from '@/app/services/evolutionService';

// POST /api/organizations/[id]/whatsapp/connect - Generate QR Code
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();
        const orgId = params.id;

        // Verify access
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

        // Save QR Code
        await prisma.organization.update({
            where: { id: orgId },
            data: { whatsappQrCode: qrCode },
        });

        return NextResponse.json({ qrCode });
    } catch (error) {
        return handleError(error);
    }
}

// GET /api/organizations/[id]/whatsapp/status - Check connection status
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();
        const orgId = params.id;

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

        // Update database if connected
        if (status.connected && !org.whatsappConnected) {
            await prisma.organization.update({
                where: { id: orgId },
                data: {
                    whatsappConnected: true,
                    whatsappPhone: status.phone,
                    whatsappConnectedAt: new Date(),
                    whatsappQrCode: null, // Clear QR code
                },
            });
        }

        return NextResponse.json(status);
    } catch (error) {
        return handleError(error);
    }
}

// DELETE /api/organizations/[id]/whatsapp/disconnect - Disconnect WhatsApp
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();
        const orgId = params.id;

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
