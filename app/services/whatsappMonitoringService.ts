import { prisma } from '@/app/lib/prisma';
import { checkConnectionStatus, sendMessage } from './evolutionService';

const LEXA_NUMBER = process.env.LEXA_WHATSAPP_NUMBER || '';

export function isLexaNumber(instanceName: string | null): boolean {
    if (!instanceName || !LEXA_NUMBER) return false;
    return instanceName.includes(LEXA_NUMBER) || instanceName.toLowerCase().includes('lexa');
}

function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');

    if (!cleaned.startsWith('55')) {
        return `55${cleaned}`;
    }

    return cleaned;
}

export async function sendDisconnectionAlert(
    organizationId: string,
    organizationName: string,
    alertPhone1: string | null,
    alertPhone2: string | null,
    lastConnected: Date | null
): Promise<void> {
    if (!LEXA_NUMBER) {
        console.error('[WhatsApp Monitoring] LEXA_WHATSAPP_NUMBER not configured in .env');
        return;
    }

    const lexaOrg = await prisma.organization.findFirst({
        where: {
            OR: [
                { evolutionInstanceName: { contains: LEXA_NUMBER } },
                { evolutionInstanceName: { contains: 'lexa', mode: 'insensitive' } },
            ],
        },
    });

    if (!lexaOrg || !lexaOrg.evolutionApiUrl || !lexaOrg.evolutionApiKey || !lexaOrg.evolutionInstanceName) {
        console.error('[WhatsApp Monitoring] LEXA organization not found or not configured');
        return;
    }

    const config = {
        apiUrl: lexaOrg.evolutionApiUrl,
        apiKey: lexaOrg.evolutionApiKey,
        instanceName: lexaOrg.evolutionInstanceName,
    };

    const now = new Date();
    const lastConnectedStr = lastConnected
        ? lastConnected.toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short'
        })
        : 'Desconhecido';

    const message = `🚨 *ALERTA DE DESCONEXÃO*

O WhatsApp da organização *${organizationName}* foi desconectado.

📅 Última conexão: ${lastConnectedStr}
⏰ Detectado em: ${now.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}

Por favor, reconecte o WhatsApp em: https://lexa-ia.com.br/perfil`;

    const phones = [alertPhone1, alertPhone2].filter(Boolean) as string[];

    for (const phone of phones) {
        try {
            const formattedPhone = formatPhoneNumber(phone);
            await sendMessage(config, formattedPhone, message);
            console.log(`[WhatsApp Monitoring] Alert sent to ${formattedPhone} for org ${organizationName}`);
        } catch (error) {
            console.error(`[WhatsApp Monitoring] Failed to send alert to ${phone}:`, error);
        }
    }
}

export async function updateConnectionStatus(
    organizationId: string,
    connected: boolean
): Promise<void> {
    const now = new Date();

    if (connected) {
        await prisma.organization.update({
            where: { id: organizationId },
            data: {
                whatsappLastConnected: now,
                whatsappConnected: true,
            },
        });
    } else {
        await prisma.organization.update({
            where: { id: organizationId },
            data: {
                whatsappLastDisconnected: now,
                whatsappConnected: false,
            },
        });
    }
}

export async function checkAllConnections(): Promise<{
    checked: number;
    disconnected: number;
    alerts: number;
}> {
    console.log('[WhatsApp Monitoring] Starting connection check...');

    const organizations = await prisma.organization.findMany({
        where: {
            whatsappMonitoringEnabled: true,
            evolutionApiUrl: { not: null },
            evolutionApiKey: { not: null },
            evolutionInstanceName: { not: null },
        },
        select: {
            id: true,
            name: true,
            evolutionApiUrl: true,
            evolutionApiKey: true,
            evolutionInstanceName: true,
            whatsappAlertPhone1: true,
            whatsappAlertPhone2: true,
            whatsappLastConnected: true,
            whatsappConnected: true,
        },
    });

    let checked = 0;
    let disconnected = 0;
    let alerts = 0;

    for (const org of organizations) {
        if (isLexaNumber(org.evolutionInstanceName)) {
            console.log(`[WhatsApp Monitoring] Skipping LEXA organization: ${org.name}`);
            continue;
        }

        checked++;

        try {
            const status = await checkConnectionStatus({
                apiUrl: org.evolutionApiUrl!,
                apiKey: org.evolutionApiKey!,
                instanceName: org.evolutionInstanceName!,
            });

            const wasConnected = org.whatsappConnected;
            const isConnected = status.connected;

            await updateConnectionStatus(org.id, isConnected);

            if (!isConnected && wasConnected) {
                disconnected++;

                if (org.whatsappAlertPhone1 || org.whatsappAlertPhone2) {
                    await sendDisconnectionAlert(
                        org.id,
                        org.name,
                        org.whatsappAlertPhone1,
                        org.whatsappAlertPhone2,
                        org.whatsappLastConnected
                    );
                    alerts++;
                }
            }

            console.log(`[WhatsApp Monitoring] ${org.name}: ${isConnected ? '🟢 Connected' : '🔴 Disconnected'}`);
        } catch (error) {
            console.error(`[WhatsApp Monitoring] Error checking ${org.name}:`, error);
        }
    }

    console.log(`[WhatsApp Monitoring] Check complete: ${checked} checked, ${disconnected} disconnected, ${alerts} alerts sent`);

    return { checked, disconnected, alerts };
}
