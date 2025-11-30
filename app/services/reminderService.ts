// Reminder Service - Automated reminders for appointments

import { prisma } from '@/app/lib/prisma';

// Send pending reminders (called by cron job)
export async function sendPendingReminders() {
    const reminders = await prisma.reminderLog.findMany({
        where: {
            status: 'pending',
            scheduledFor: { lte: new Date() },
        },
        include: {
            appointment: {
                include: {
                    lead: true,
                    organization: {
                        include: {
                            agents: {
                                take: 1,
                            },
                        },
                    },
                },
            },
        },
        take: 50,
    });

    for (const reminder of reminders) {
        try {
            const org = reminder.appointment.organization;
            const agent = org.agents[0];

            if (!agent || !org.evolutionApiUrl || !org.evolutionApiKey) {
                await prisma.reminderLog.update({
                    where: { id: reminder.id },
                    data: { status: 'failed' },
                });
                continue;
            }

            // Send via Evolution API
            await fetch(`${org.evolutionApiUrl}/message/sendText/${org.evolutionInstanceName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: org.evolutionApiKey,
                },
                body: JSON.stringify({
                    number: reminder.appointment.lead?.phone,
                    text: reminder.message,
                }),
            });

            await prisma.reminderLog.update({
                where: { id: reminder.id },
                data: {
                    status: 'sent',
                    sentAt: new Date(),
                },
            });
        } catch (error) {
            console.error('Error sending reminder:', error);
            await prisma.reminderLog.update({
                where: { id: reminder.id },
                data: { status: 'failed' },
            });
        }
    }
}
