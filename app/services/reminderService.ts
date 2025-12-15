import apiClient from '@/app/lib/api-client';

export async function sendPendingReminders() {
    try {
        console.log('[Reminder Service] Calling backend API...');
        const response = await apiClient.post('/reminders/send-pending');
        console.log(`[Reminder Service] Backend processed ${response.data.processed} reminders`);
        return response.data.processed;
    } catch (error) {
        console.error('[Reminder Service] Error calling backend:', error);
        throw error;
    }
}
