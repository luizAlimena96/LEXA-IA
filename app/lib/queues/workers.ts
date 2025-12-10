// Queue Workers Manager
// Initializes and manages all queue workers

import { Worker, WorkerOptions } from 'bullmq';
import { getRedisConnection } from '../redis';
import { QUEUE_NAMES } from './index';
import { processRemindersJob } from './jobs/reminders.job';
import { processAgentFollowupsJob } from './jobs/agent-followups.job';
import { processAppointmentRemindersJob } from './jobs/appointment-reminders.job';

const workers: Worker[] = [];

// Worker configuration
const workerOptions: WorkerOptions = {
    connection: getRedisConnection(),
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
    limiter: {
        max: 10, // Max 10 jobs
        duration: 1000, // per second
    },
};

export function initializeWorkers(): void {
    console.log('[Workers] Initializing workers...');

    // Reminders Worker
    const remindersWorker = new Worker(
        QUEUE_NAMES.REMINDERS,
        async (job) => {
            return await processRemindersJob(job);
        },
        {
            ...workerOptions,
            concurrency: 3, // Lower concurrency for reminders
        }
    );

    remindersWorker.on('completed', (job) => {
        console.log(`[Reminders Worker] ✅ Job ${job.id} completed`);
    });

    remindersWorker.on('failed', (job, err) => {
        console.error(`[Reminders Worker] ❌ Job ${job?.id} failed:`, err.message);
    });

    remindersWorker.on('error', (err) => {
        console.error('[Reminders Worker] Worker error:', err);
    });

    workers.push(remindersWorker);

    // Agent Follow-ups Worker
    const followupsWorker = new Worker(
        QUEUE_NAMES.AGENT_FOLLOWUPS,
        async (job) => {
            return await processAgentFollowupsJob(job);
        },
        {
            ...workerOptions,
            concurrency: 3,
        }
    );

    followupsWorker.on('completed', (job, result) => {
        console.log(`[Follow-ups Worker] ✅ Job ${job.id} completed. Processed: ${result}`);
    });

    followupsWorker.on('failed', (job, err) => {
        console.error(`[Follow-ups Worker] ❌ Job ${job?.id} failed:`, err.message);
    });

    followupsWorker.on('error', (err) => {
        console.error('[Follow-ups Worker] Worker error:', err);
    });

    workers.push(followupsWorker);

    // Appointment Reminders Worker
    const appointmentRemindersWorker = new Worker(
        QUEUE_NAMES.APPOINTMENT_REMINDERS,
        async (job) => {
            return await processAppointmentRemindersJob(job);
        },
        {
            ...workerOptions,
            concurrency: 5, // Higher concurrency for appointment reminders
        }
    );

    appointmentRemindersWorker.on('completed', (job, result) => {
        if (result > 0) {
            console.log(`[Appointment Reminders Worker] ✅ Job ${job.id} completed. Processed: ${result}`);
        }
    });

    appointmentRemindersWorker.on('failed', (job, err) => {
        console.error(`[Appointment Reminders Worker] ❌ Job ${job?.id} failed:`, err.message);
    });

    appointmentRemindersWorker.on('error', (err) => {
        console.error('[Appointment Reminders Worker] Worker error:', err);
    });

    workers.push(appointmentRemindersWorker);

    console.log('[Workers] ✅ All workers initialized');
}

export async function closeAllWorkers(): Promise<void> {
    console.log('[Workers] Closing all workers...');

    for (const worker of workers) {
        await worker.close();
    }

    workers.length = 0;
    console.log('[Workers] ✅ All workers closed');
}

export function getWorkers(): Worker[] {
    return workers;
}
