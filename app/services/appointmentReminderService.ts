// Appointment Reminder Service - Manage appointment reminders and notifications

import { prisma } from '@/app/lib/prisma';

export interface AppointmentReminderConfig {
    id: string;
    autoSchedulingConfigId: string;
    minutesBefore: number;
    sendToLead: boolean;
    sendToTeam: boolean;
    leadMessageTemplate: string;
    teamMessageTemplate?: string | null;
    isActive: boolean;
}

export interface CreateReminderConfigInput {
    minutesBefore: number;
    sendToLead?: boolean;
    sendToTeam?: boolean;
    leadMessageTemplate: string;
    teamMessageTemplate?: string;
}

export interface AppointmentReminder {
    id: string;
    appointmentId: string;
    scheduledFor: Date;
    minutesBefore: number;
    sendToLead: boolean;
    sendToTeam: boolean;
    leadMessageTemplate: string;
    teamMessageTemplate?: string | null;
    teamPhones: string[];
    sent: boolean;
    sentAt?: Date | null;
}

/**
 * Get reminder configs for an auto-scheduling config
 */
export async function getReminderConfigs(
    autoSchedulingConfigId: string
): Promise<AppointmentReminderConfig[]> {
    const configs = await prisma.appointmentReminderConfig.findMany({
        where: { autoSchedulingConfigId },
        orderBy: { minutesBefore: 'desc' },
    });

    return configs;
}

/**
 * Create a reminder config
 */
export async function createReminderConfig(
    autoSchedulingConfigId: string,
    data: CreateReminderConfigInput
): Promise<AppointmentReminderConfig> {
    const config = await prisma.appointmentReminderConfig.create({
        data: {
            autoSchedulingConfigId,
            minutesBefore: data.minutesBefore,
            sendToLead: data.sendToLead ?? true,
            sendToTeam: data.sendToTeam ?? false,
            leadMessageTemplate: data.leadMessageTemplate,
            teamMessageTemplate: data.teamMessageTemplate || null,
        },
    });

    return config;
}

/**
 * Update a reminder config
 */
export async function updateReminderConfig(
    configId: string,
    data: Partial<CreateReminderConfigInput>
): Promise<AppointmentReminderConfig> {
    const config = await prisma.appointmentReminderConfig.update({
        where: { id: configId },
        data,
    });

    return config;
}

/**
 * Delete a reminder config
 */
export async function deleteReminderConfig(configId: string): Promise<void> {
    await prisma.appointmentReminderConfig.delete({
        where: { id: configId },
    });
}

/**
 * Create appointment reminders based on config
 */
export async function createAppointmentReminders(
    appointmentId: string,
    scheduledAt: Date,
    autoSchedulingConfigId: string,
    teamPhones: string[]
): Promise<void> {
    // Get reminder configs
    const configs = await getReminderConfigs(autoSchedulingConfigId);

    // Create reminders
    for (const config of configs) {
        if (!config.isActive) continue;

        const reminderTime = new Date(scheduledAt);
        reminderTime.setMinutes(reminderTime.getMinutes() - config.minutesBefore);

        // Only create if reminder time is in the future
        if (reminderTime > new Date()) {
            await prisma.appointmentReminder.create({
                data: {
                    appointmentId,
                    reminderConfigId: config.id,
                    scheduledFor: reminderTime,
                    minutesBefore: config.minutesBefore,
                    sendToLead: config.sendToLead,
                    sendToTeam: config.sendToTeam,
                    leadMessageTemplate: config.leadMessageTemplate,
                    teamMessageTemplate: config.teamMessageTemplate,
                    teamPhones,
                },
            });
        }
    }
}

/**
 * Send confirmation message when appointment is created
 */
export async function sendAppointmentConfirmation(
    appointmentId: string,
    autoSchedulingConfigId: string
): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            lead: true,
        },
    });

    if (!appointment) return;

    const config = await prisma.autoSchedulingConfig.findUnique({
        where: { id: autoSchedulingConfigId },
    });

    if (!config || !config.sendConfirmation) return;

    // Send to lead
    if (appointment.lead && config.confirmationTemplate) {
        const message = formatReminderMessage(
            config.confirmationTemplate,
            appointment,
            appointment.lead
        );

        await sendWhatsAppMessage(appointment.lead.phone, message);
    }

    // Send to team
    if (config.notifyTeam && config.teamPhones.length > 0) {
        const teamMessage = formatTeamMessage(
            config.confirmationTemplate || 'Novo agendamento criado',
            appointment,
            appointment.lead
        );

        for (const phone of config.teamPhones) {
            await sendWhatsAppMessage(phone, teamMessage);
        }
    }
}

/**
 * Send cancellation message
 */
export async function sendCancellationMessage(
    appointmentId: string,
    autoSchedulingConfigId: string
): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { lead: true },
    });

    if (!appointment) return;

    const config = await prisma.autoSchedulingConfig.findUnique({
        where: { id: autoSchedulingConfigId },
    });

    if (!config || !config.cancellationTemplate) return;

    // Send to lead
    if (appointment.lead) {
        const message = formatReminderMessage(
            config.cancellationTemplate,
            appointment,
            appointment.lead
        );

        await sendWhatsAppMessage(appointment.lead.phone, message);
    }

    // Send to team
    if (config.notifyTeam && config.teamPhones.length > 0) {
        const teamMessage = formatTeamMessage(
            config.cancellationTemplate,
            appointment,
            appointment.lead
        );

        for (const phone of config.teamPhones) {
            await sendWhatsAppMessage(phone, teamMessage);
        }
    }

    // Cancel pending reminders
    await prisma.appointmentReminder.updateMany({
        where: {
            appointmentId,
            sent: false,
        },
        data: {
            sent: true,
            sentAt: new Date(),
        },
    });
}

/**
 * Send rescheduling message
 */
export async function sendReschedulingMessage(
    appointmentId: string,
    autoSchedulingConfigId: string,
    newScheduledAt: Date
): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { lead: true },
    });

    if (!appointment) return;

    const config = await prisma.autoSchedulingConfig.findUnique({
        where: { id: autoSchedulingConfigId },
    });

    if (!config || !config.reschedulingTemplate) return;

    // Send to lead
    if (appointment.lead) {
        const message = formatReminderMessage(
            config.reschedulingTemplate,
            { ...appointment, scheduledAt: newScheduledAt },
            appointment.lead
        );

        await sendWhatsAppMessage(appointment.lead.phone, message);
    }

    // Send to team
    if (config.notifyTeam && config.teamPhones.length > 0) {
        const teamMessage = formatTeamMessage(
            config.reschedulingTemplate,
            { ...appointment, scheduledAt: newScheduledAt },
            appointment.lead
        );

        for (const phone of config.teamPhones) {
            await sendWhatsAppMessage(phone, teamMessage);
        }
    }

    // Cancel old reminders and create new ones
    await prisma.appointmentReminder.deleteMany({
        where: {
            appointmentId,
            sent: false,
        },
    });

    await createAppointmentReminders(
        appointmentId,
        newScheduledAt,
        autoSchedulingConfigId,
        config.teamPhones
    );
}

/**
 * Process pending reminders (called by cron job)
 */
export async function processPendingReminders(): Promise<number> {
    const now = new Date();

    // Get pending reminders
    const pendingReminders = await prisma.appointmentReminder.findMany({
        where: {
            scheduledFor: { lte: now },
            sent: false,
            appointment: {
                status: 'SCHEDULED',
            },
        },
        include: {
            appointment: {
                include: {
                    lead: true,
                },
            },
        },
        take: 50, // Process in batches
    });

    let processed = 0;

    for (const reminder of pendingReminders) {
        try {
            // Send to lead
            if (reminder.sendToLead && reminder.appointment.lead) {
                const message = formatReminderMessage(
                    reminder.leadMessageTemplate,
                    reminder.appointment,
                    reminder.appointment.lead
                );

                await sendWhatsAppMessage(reminder.appointment.lead.phone, message);
            }

            // Send to team
            if (reminder.sendToTeam && reminder.teamPhones.length > 0) {
                const teamMessage = formatTeamMessage(
                    reminder.teamMessageTemplate || reminder.leadMessageTemplate,
                    reminder.appointment,
                    reminder.appointment.lead
                );

                for (const phone of reminder.teamPhones) {
                    await sendWhatsAppMessage(phone, teamMessage);
                }
            }

            // Mark as sent
            await prisma.appointmentReminder.update({
                where: { id: reminder.id },
                data: {
                    sent: true,
                    sentAt: new Date(),
                },
            });

            processed++;
        } catch (error) {
            console.error(`Error processing reminder ${reminder.id}:`, error);
        }
    }

    return processed;
}

/**
 * Format reminder message with variables
 */
export function formatReminderMessage(
    template: string,
    appointment: any,
    lead: any
): string {
    let message = template;

    // Lead variables
    message = message.replace(/\{\{lead\.name\}\}/g, lead?.name || 'Cliente');
    message = message.replace(/\{\{lead\.phone\}\}/g, lead?.phone || '');
    message = message.replace(/\{\{lead\.email\}\}/g, lead?.email || '');
    message = message.replace(/\{\{lead\.cpf\}\}/g, lead?.cpf || '');

    // Appointment variables
    const date = new Date(appointment.scheduledAt);
    const dateStr = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });
    const dateTimeStr = `${dateStr} às ${timeStr}`;

    message = message.replace(/\{\{appointment\.date\}\}/g, dateStr);
    message = message.replace(/\{\{appointment\.time\}\}/g, timeStr);
    message = message.replace(/\{\{appointment\.dateTime\}\}/g, dateTimeStr);
    message = message.replace(/\{\{appointment\.duration\}\}/g, String(appointment.duration || 60));

    // Calculated variables
    const now = new Date();
    const minutesUntil = Math.floor((date.getTime() - now.getTime()) / 60000);
    const hoursUntil = Math.floor(minutesUntil / 60);

    message = message.replace(/\{\{minutesUntil\}\}/g, String(minutesUntil));
    message = message.replace(/\{\{hoursUntil\}\}/g, String(hoursUntil));

    // Extracted data (if exists)
    if (lead?.extractedData) {
        try {
            const extracted = typeof lead.extractedData === 'string'
                ? JSON.parse(lead.extractedData)
                : lead.extractedData;

            Object.keys(extracted).forEach((key) => {
                const regex = new RegExp(`\\{\\{lead\\.extractedData\\.${key}\\}\\}`, 'g');
                message = message.replace(regex, String(extracted[key] || ''));
            });
        } catch (e) {
            // Ignore parsing errors
        }
    }

    return message;
}

/**
 * Format team message with additional info
 */
function formatTeamMessage(template: string, appointment: any, lead: any): string {
    let message = formatReminderMessage(template, appointment, lead);

    // Add team-specific info if not already in template
    if (!template.includes('{{lead.phone}}') && lead?.phone) {
        message += `\n\nTelefone: ${lead.phone}`;
    }

    return message;
}

/**
 * Send WhatsApp message via Evolution API
 */
async function sendWhatsAppMessage(phone: string, message: string): Promise<void> {
    try {
        const evolutionApiUrl = process.env.EVOLUTION_API_URL;
        const evolutionApiKey = process.env.EVOLUTION_API_KEY;
        const instanceName = process.env.EVOLUTION_INSTANCE_NAME;

        if (!evolutionApiUrl || !evolutionApiKey || !instanceName) {
            console.error('Evolution API not configured');
            throw new Error('Evolution API not configured');
        }

        // Format phone number (remove non-digits and ensure country code)
        const formattedPhone = phone.replace(/\D/g, '');
        const phoneWithSuffix = formattedPhone.includes('@')
            ? formattedPhone
            : `${formattedPhone}@s.whatsapp.net`;

        const response = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionApiKey,
            },
            body: JSON.stringify({
                number: phoneWithSuffix,
                text: message,
                delay: 1000,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Evolution API error:', error);
            throw new Error(`Failed to send WhatsApp message: ${error}`);
        }

        const result = await response.json();
        console.log('WhatsApp message sent successfully:', result);
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        throw error;
    }
}

/**
 * Send WhatsApp message with retry logic
 */
async function sendWhatsAppMessageWithRetry(
    phone: string,
    message: string,
    maxRetries: number = 3
): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await sendWhatsAppMessage(phone, message);
            return; // Success
        } catch (error) {
            console.error(`Attempt ${attempt}/${maxRetries} failed:`, error);

            if (attempt === maxRetries) {
                // Last attempt failed
                throw error;
            }

            // Wait before retry (exponential backoff)
            const waitTime = 1000 * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}
