import { getQueue, QUEUE_NAMES } from './index';

export async function scheduleJobs(): Promise<void> {
    console.log('[Scheduler] Scheduling repeatable jobs with optimized intervals...');

    try {
        const remindersQueue = getQueue(QUEUE_NAMES.REMINDERS);
        await remindersQueue.add(
            'check-reminders',
            { triggeredAt: new Date() },
            {
                repeat: {
                    pattern: '*/15 * * * *', // Mudado de 5 para 15 minutos
                },
                jobId: 'reminders-repeatable',
            }
        );
        console.log('[Scheduler] ✅ Reminders job scheduled (every 15 minutes)');

        const followupsQueue = getQueue(QUEUE_NAMES.AGENT_FOLLOWUPS);
        await followupsQueue.add(
            'check-agent-followups',
            { triggeredAt: new Date() },
            {
                repeat: {
                    pattern: '*/15 * * * *', // Mudado de 5 para 15 minutos
                },
                jobId: 'agent-followups-repeatable',
            }
        );
        console.log('[Scheduler] ✅ Agent follow-ups job scheduled (every 15 minutes)');

        const appointmentRemindersQueue = getQueue(QUEUE_NAMES.APPOINTMENT_REMINDERS);
        await appointmentRemindersQueue.add(
            'check-appointment-reminders',
            { triggeredAt: new Date() },
            {
                repeat: {
                    pattern: '*/15 * * * *', // Mudado de 5 para 15 minutos
                },
                jobId: 'appointment-reminders-repeatable',
            }
        );
        console.log('[Scheduler] ✅ Appointment reminders job scheduled (every 15 minutes)');

        const whatsappMonitoringQueue = getQueue(QUEUE_NAMES.WHATSAPP_MONITORING);
        await whatsappMonitoringQueue.add(
            'check-whatsapp-connections',
            { triggeredAt: new Date() },
            {
                repeat: {
                    pattern: '0 * * * *', // Mudado de 30 minutos para 1 hora
                },
                jobId: 'whatsapp-monitoring-repeatable',
            }
        );
        console.log('[Scheduler] ✅ WhatsApp monitoring job scheduled (every hour)');

        console.log('[Scheduler] ✅ All jobs scheduled successfully with reduced frequency');
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
            pattern: '*/15 * * * *', // Atualizado para 15 minutos
        });

        const followupsQueue = getQueue(QUEUE_NAMES.AGENT_FOLLOWUPS);
        await followupsQueue.removeRepeatable('check-agent-followups', {
            pattern: '*/15 * * * *', // Atualizado para 15 minutos
        });

        const appointmentRemindersQueue = getQueue(QUEUE_NAMES.APPOINTMENT_REMINDERS);
        await appointmentRemindersQueue.removeRepeatable('check-appointment-reminders', {
            pattern: '*/15 * * * *', // Atualizado para 15 minutos
        });

        const whatsappMonitoringQueue = getQueue(QUEUE_NAMES.WHATSAPP_MONITORING);
        await whatsappMonitoringQueue.removeRepeatable('check-whatsapp-connections', {
            pattern: '0 * * * *', // Atualizado para 1 hora
        });

        console.log('[Scheduler] ✅ All scheduled jobs removed');
    } catch (error) {
        console.error('[Scheduler] Error removing scheduled jobs:', error);
    }
}
