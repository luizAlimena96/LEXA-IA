import { prisma } from '@/app/lib/prisma';
import { sendMessage } from './whatsappService';

export async function checkAndTriggerNotifications(
    leadId: string,
    newStateId: string // Can be State ID or Matrix Item ID
) {
    try {
        console.log(`🔔 Checking notifications for state change: ${newStateId}`);

        // 1. Find the lead to get context (name, phone, etc)
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: {
                agent: true,
                conversations: {
                    orderBy: { updatedAt: 'desc' },
                    take: 1,
                }
            }
        });

        if (!lead || !lead.conversations[0]) {
            console.log('Lead or conversation not found for notification');
            return;
        }

        const conversation = lead.conversations[0];
        const agent = lead.agent;

        // 2. Find active notifications for this state/matrix item
        const notifications = await prisma.agentNotification.findMany({
            where: {
                agentId: agent.id,
                isActive: true,
                OR: [
                    { agentStateId: newStateId },
                    { matrixItemId: newStateId }
                ]
            },
            include: {
                agentState: true,
                matrixItem: true
            }
        });

        if (notifications.length === 0) {
            console.log('No notifications found for this state');
            return;
        }

        console.log(`Found ${notifications.length} notifications to execute`);

        // 3. Execute each notification
        for (const notification of notifications) {
            // A. Send to LEAD
            if (notification.leadMessage) {
                let message = notification.leadMessage;
                message = replaceVariables(message, lead);

                await sendMessage(conversation.id, message);
                console.log(`📱 Notification sent to LEAD ${lead.phone}`);
            }

            // B. Send to TEAM
            if (notification.teamMessage) {
                let message = notification.teamMessage;
                message = replaceVariables(message, lead);

                // Determine numbers to send to
                let phonesToSend = notification.teamPhones && notification.teamPhones.length > 0
                    ? notification.teamPhones
                    : agent.notificationPhones;

                if (phonesToSend.length === 0) {
                    console.log('No team phones configured for notification');
                    continue;
                }

                // Send to each team number
                // We need to use the Evolution API directly or a helper that sends to a specific number
                // Since sendMessage requires a conversationId, we might need a different helper.
                // Let's assume we can use a helper that sends to a number directly via Evolution API.
                // I'll import `sendWhatsAppMessage` if available or implement it here.

                // For now, I'll assume we need to implement sending to arbitrary numbers.
                // I'll check whatsappService for `sendToNumber` or similar.
                // If not, I'll implement it using the organization config.

                const organization = await prisma.organization.findUnique({
                    where: { id: agent.organizationId }
                });

                if (organization?.evolutionApiUrl && organization?.evolutionApiKey && organization?.evolutionInstanceName) {
                    for (const phone of phonesToSend) {
                        await sendDirectWhatsApp(
                            phone,
                            message,
                            organization.evolutionApiUrl,
                            organization.evolutionApiKey,
                            organization.evolutionInstanceName
                        );
                        console.log(`👨‍💼 Notification sent to TEAM ${phone}`);
                    }
                } else {
                    console.error('Evolution API not configured for team notifications');
                }
            }
        }

    } catch (error) {
        console.error('Error in checkAndTriggerNotifications:', error);
    }
}

function replaceVariables(template: string, lead: any): string {
    let result = template;

    // Basic variables
    result = result.replace(/{{lead.name}}/g, lead.name || 'Cliente')
        .replace(/{{lead.phone}}/g, lead.phone || '')
        .replace(/{{lead.email}}/g, lead.email || '');

    // Extracted Data (JSON)
    if (lead.extractedData) {
        try {
            const data = typeof lead.extractedData === 'string'
                ? JSON.parse(lead.extractedData)
                : lead.extractedData;

            if (data) {
                Object.keys(data).forEach(key => {
                    const regex = new RegExp(`{{lead.extractedData.${key}}}`, 'g');
                    result = result.replace(regex, data[key] || '');

                    // Also support {{extractedData.key}} for brevity
                    const regexShort = new RegExp(`{{extractedData.${key}}}`, 'g');
                    result = result.replace(regexShort, data[key] || '');
                });
            }
        } catch (e) {
            console.error('Error parsing extractedData for variables', e);
        }
    }

    return result;
}

async function sendDirectWhatsApp(
    phone: string,
    message: string,
    apiUrl: string,
    apiKey: string,
    instanceName: string
) {
    try {
        // Format phone (ensure only numbers)
        const cleanPhone = phone.replace(/\D/g, '');

        await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey,
            },
            body: JSON.stringify({
                number: cleanPhone,
                text: message,
            }),
        });
    } catch (error) {
        console.error(`Failed to send direct WhatsApp to ${phone}`, error);
    }
}
