// Reminder Service - Send scheduled appointment reminders via WhatsApp

import { prisma } from '@/app/lib/prisma';
import { sendMessage } from './evolutionService';

/**
 * Send all pending reminders that are due
 * Called by cron job every 5 minutes
 */
export async function sendPendingReminders() {
    try {
        const now = new Date();

        console.log(`[Reminders] Checking for pending reminders at ${now.toISOString()}`);

        // Get all pending reminders that are due
        const pendingReminders = await prisma.reminderLog.findMany({
            where: {
                status: 'pending',
                scheduledFor: {
                    lte: now
                }
            },
            include: {
                appointment: {
                    include: {
                        lead: true,
                        organization: true
                    }
                }
            },
            take: 50 // Process max 50 at a time
        });

        console.log(`[Reminders] Found ${pendingReminders.length} pending reminders`);

        let sentCount = 0;
        let failedCount = 0;

        for (const reminder of pendingReminders) {
            try {
                const { appointment } = reminder;

                if (!appointment) {
                    console.error(`[Reminders] Appointment not found for reminder ${reminder.id}`);
                    await markReminderFailed(reminder.id);
                    failedCount++;
                    continue;
                }

                // Skip if appointment is cancelled
                if (appointment.status === 'CANCELLED') {
                    await markReminderCancelled(reminder.id);
                    continue;
                }

                // Skip if appointment is in the past
                if (appointment.scheduledAt < now) {
                    await markReminderCancelled(reminder.id);
                    continue;
                }

                const { organization, lead } = appointment;

                if (!organization?.evolutionApiUrl || !organization?.evolutionApiKey || !organization?.evolutionInstanceName) {
                    console.error(`[Reminders] Missing Evolution API config for organization ${organization?.id}`);
                    await markReminderFailed(reminder.id);
                    failedCount++;
                    continue;
                }

                if (!lead?.phone) {
                    console.error(`[Reminders] Missing phone for lead ${lead?.id}`);
                    await markReminderFailed(reminder.id);
                    failedCount++;
                    continue;
                }

                // Send reminder via WhatsApp
                await sendMessage(
                    {
                        apiUrl: organization.evolutionApiUrl,
                        apiKey: organization.evolutionApiKey,
                        instanceName: organization.evolutionInstanceName
                    },
                    lead.phone,
                    reminder.message
                );

                // Mark as sent
                await prisma.reminderLog.update({
                    where: { id: reminder.id },
                    data: {
                        status: 'sent',
                        sentAt: new Date()
                    }
                });

                sentCount++;
                console.log(`[Reminders] ✅ Sent reminder to ${lead.phone} for appointment ${appointment.id}`);

            } catch (error) {
                console.error(`[Reminders] ❌ Error sending reminder ${reminder.id}:`, error);
                await markReminderFailed(reminder.id);
                failedCount++;
            }
        }

        console.log(`[Reminders] Summary: ${sentCount} sent, ${failedCount} failed`);

        return {
            total: pendingReminders.length,
            sent: sentCount,
            failed: failedCount
        };

    } catch (error) {
        console.error('[Reminders] Error in sendPendingReminders:', error);
        throw error;
    }
}

/**
 * Mark reminder as failed
 */
async function markReminderFailed(reminderId: string) {
    await prisma.reminderLog.update({
        where: { id: reminderId },
        data: { status: 'failed' }
    });
}

/**
 * Mark reminder as cancelled
 */
async function markReminderCancelled(reminderId: string) {
    await prisma.reminderLog.update({
        where: { id: reminderId },
        data: { status: 'cancelled' }
    });
}

/**
 * Get reminder statistics for an organization
 */
export async function getReminderStats(organizationId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const stats = await prisma.reminderLog.groupBy({
        by: ['status'],
        where: {
            appointment: {
                organizationId
            },
            createdAt: {
                gte: since
            }
        },
        _count: true
    });

    return stats.reduce((acc: Record<string, number>, stat: { status: string; _count: number }) => {
        acc[stat.status] = stat._count;
        return acc;
    }, {} as Record<string, number>);
}
