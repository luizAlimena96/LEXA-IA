// Queue Scheduler
// Schedules repeatable jobs to replace cron jobs

import { getQueue, QUEUE_NAMES } from './index';

export async function scheduleJobs(): Promise<void> {
    console.log('[Scheduler] Scheduling repeatable jobs...');

    try {
        // Schedule Reminders Job (every 5 minutes)
        const remindersQueue = getQueue(QUEUE_NAMES.REMINDERS);
        await remindersQueue.add(
            'check-reminders',
            { triggeredAt: new Date() },
            {
                repeat: {
                    pattern: '*/5 * * * *', // Every 5 minutes
                },
                jobId: 'reminders-repeatable', // Unique ID to prevent duplicates
            }
        );
        console.log('[Scheduler] ✅ Reminders job scheduled (every 5 minutes)');

        // Schedule Agent Follow-ups Job (every 5 minutes)
        const followupsQueue = getQueue(QUEUE_NAMES.AGENT_FOLLOWUPS);
        await followupsQueue.add(
            'check-agent-followups',
            { triggeredAt: new Date() },
            {
                repeat: {
                    pattern: '*/5 * * * *', // Every 5 minutes
                },
                jobId: 'agent-followups-repeatable',
            }
        );
        console.log('[Scheduler] ✅ Agent follow-ups job scheduled (every 5 minutes)');

        // Schedule Appointment Reminders Job (every 5 minutes)
        const appointmentRemindersQueue = getQueue(QUEUE_NAMES.APPOINTMENT_REMINDERS);
        await appointmentRemindersQueue.add(
            'check-appointment-reminders',
            { triggeredAt: new Date() },
            {
                repeat: {
                    pattern: '*/5 * * * *', // Every 5 minutes
                },
                jobId: 'appointment-reminders-repeatable',
            }
        );
        console.log('[Scheduler] ✅ Appointment reminders job scheduled (every 5 minutes)');

        console.log('[Scheduler] ✅ All jobs scheduled successfully');
    } catch (error) {
        console.error('[Scheduler] ❌ Error scheduling jobs:', error);
        throw error;
    }
}

export async function removeAllScheduledJobs(): Promise<void> {
    console.log('[Scheduler] Removing all scheduled jobs...');

    try {
        const remindersQueue = getQueue(QUEUE_NAMES.REMINDERS);
        await remindersQueue.removeRepeatable('check-reminders', {
            pattern: '*/5 * * * *',
        });

        const followupsQueue = getQueue(QUEUE_NAMES.AGENT_FOLLOWUPS);
        await followupsQueue.removeRepeatable('check-agent-followups', {
            pattern: '*/5 * * * *',
        });

        const appointmentRemindersQueue = getQueue(QUEUE_NAMES.APPOINTMENT_REMINDERS);
        await appointmentRemindersQueue.removeRepeatable('check-appointment-reminders', {
            pattern: '*/5 * * * *',
        });

        console.log('[Scheduler] ✅ All scheduled jobs removed');
    } catch (error) {
        console.error('[Scheduler] Error removing scheduled jobs:', error);
    }
}
