// Cron Jobs - Automated tasks for reminders and follow-ups

import cron from 'node-cron';
import { sendPendingReminders } from '../services/reminderService';
import { checkAndSendFollowups } from '../services/followupService';

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

// Run follow-ups every hour
cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Checking inactive leads for follow-ups...');
    try {
        await checkAndSendFollowups();
        console.log('[CRON] Follow-ups processed successfully');
    } catch (error) {
        console.error('[CRON] Error processing follow-ups:', error);
    }
});

console.log('[CRON] Jobs scheduled:');
console.log('- Reminders: Every 5 minutes');
console.log('- Follow-ups: Every hour');
