// Cron Jobs - Automated tasks for reminders and follow-ups

import cron from 'node-cron';
import { sendPendingReminders } from '../services/reminderService';
import { checkAgentFollowUps } from '../services/agentFollowupService';
import { processPendingReminders } from '../services/appointmentReminderService';

// Run reminders every 5 minutes
cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Checking pending reminders...');
    try {
        await sendPendingReminders();
        console.log('[CRON] Reminders processed successfully');
    } catch (error) {
        console.error('[CRON] Error processing reminders:', error);
    }
});

// Run follow-ups every 5 minutes (for better precision)
cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Checking agent follow-ups...');
    try {
        await checkAgentFollowUps();
        console.log('[CRON] Follow-ups processed successfully');
    } catch (error) {
        console.error('[CRON] Error processing follow-ups:', error);
    }
});

// Run appointment reminders every 5 minutes (optimized for CPU usage)
cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Checking appointment reminders...');
    try {
        const processed = await processPendingReminders();
        if (processed > 0) {
            console.log(`[CRON] Processed ${processed} appointment reminders`);
        }
    } catch (error) {
        console.error('[CRON] Error processing appointment reminders:', error);
    }
});

console.log('[CRON] Jobs scheduled:');
console.log('- Reminders: Every 5 minutes');
console.log('- Follow-ups: Every 5 minutes');
console.log('- Appointment Reminders: Every 5 minutes');
