// Appointment Reminder Service
// Handles processing pending appointment reminders

import apiClient from '@/app/lib/api-client';

export async function processPendingReminders() {
    try {
        console.log('[Appointment Reminder Service] Calling backend API...');
        // TODO: Create backend endpoint for appointment reminders
        // const response = await apiClient.post('/appointments/send-reminders');
        console.log('[Appointment Reminder Service] Backend endpoint not implemented yet');
        return 0;
    } catch (error) {
        console.error('[Appointment Reminder Service] Error calling backend:', error);
        throw error;
    }
}
