// Appointment Reminders Job Processor
// Processes appointment reminder jobs from the queue

import { Job } from 'bullmq';
import { processPendingReminders } from '@/app/services/appointmentReminderService';

export interface AppointmentRemindersJobData {
    // No specific data needed for this job
    triggeredAt: Date;
}

export async function processAppointmentRemindersJob(
    job: Job<AppointmentRemindersJobData>
): Promise<number> {
    console.log(`[Appointment Reminders Job] Processing job ${job.id}...`);

    try {
        const processedCount = await processPendingReminders();

        if (processedCount > 0) {
            console.log(`[Appointment Reminders Job] ✅ Job ${job.id} completed. Processed ${processedCount} reminders`);
        }

        return processedCount;
    } catch (error) {
        console.error(`[Appointment Reminders Job] ❌ Job ${job.id} failed:`, error);
        throw error; // Re-throw to trigger retry
    }
}
