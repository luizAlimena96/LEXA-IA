// Reminders Job Processor
// Processes reminder jobs from the queue

import { Job } from 'bullmq';
import { sendPendingReminders } from '@/app/services/reminderService';

export interface RemindersJobData {
    // No specific data needed for this job
    triggeredAt: Date;
}

export async function processRemindersJob(job: Job<RemindersJobData>): Promise<void> {
    console.log(`[Reminders Job] Processing job ${job.id}...`);

    try {
        await sendPendingReminders();
        console.log(`[Reminders Job] ✅ Job ${job.id} completed successfully`);
    } catch (error) {
        console.error(`[Reminders Job] ❌ Job ${job.id} failed:`, error);
        throw error; // Re-throw to trigger retry
    }
}
