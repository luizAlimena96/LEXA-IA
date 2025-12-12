import { Worker, WorkerOptions } from 'bullmq';
import { getRedisConnection } from '../redis';
import { QUEUE_NAMES } from './index';
import { processRemindersJob } from './jobs/reminders.job';
import { processAgentFollowupsJob } from './jobs/agent-followups.job';
import { processAppointmentRemindersJob } from './jobs/appointment-reminders.job';
import { processWhatsAppMonitoring } from './jobs/whatsapp-monitoring.job';

const workers: Worker[] = [];
let workersInitialized = false;

const workerOptions: WorkerOptions = {
    connection: getRedisConnection(),
    concurrency: 1, // Reduzido para evitar sobrecarga de conexões
    limiter: {
        max: 5, // Reduzido de 10 para 5
        duration: 1000,
    },
};

export function initializeWorkers(): void {
    if (workersInitialized) {
        console.log('[Workers] Workers already initialized, skipping...');
        return;
    }

    if (workers.length > 0) {
        console.log('[Workers] Workers array not empty, cleaning up first...');
        closeAllWorkers();
    }

    console.log('[Workers] Initializing workers with reduced concurrency...');

    const remindersWorker = new Worker(
        QUEUE_NAMES.REMINDERS,
        async (job) => {
            return await processRemindersJob(job);
        },
        {
            ...workerOptions,
            concurrency: 1, // Reduzido de 3 para 1
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

    const followupsWorker = new Worker(
        QUEUE_NAMES.AGENT_FOLLOWUPS,
        async (job) => {
            return await processAgentFollowupsJob(job);
        },
        {
            ...workerOptions,
            concurrency: 1, // Reduzido de 3 para 1
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

    const appointmentRemindersWorker = new Worker(
        QUEUE_NAMES.APPOINTMENT_REMINDERS,
        async (job) => {
            return await processAppointmentRemindersJob(job);
        },
        {
            ...workerOptions,
            concurrency: 2, // Reduzido de 5 para 2 (prioridade alta)
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

    const whatsappMonitoringWorker = new Worker(
        QUEUE_NAMES.WHATSAPP_MONITORING,
        async (job) => {
            return await processWhatsAppMonitoring();
        },
        {
            ...workerOptions,
            concurrency: 1,
        }
    );

    whatsappMonitoringWorker.on('completed', (job, result) => {
        console.log(`[WhatsApp Monitoring Worker] ✅ Job ${job.id} completed:`, result);
    });

    whatsappMonitoringWorker.on('failed', (job, err) => {
        console.error(`[WhatsApp Monitoring Worker] ❌ Job ${job?.id} failed:`, err.message);
    });

    whatsappMonitoringWorker.on('error', (err) => {
        console.error('[WhatsApp Monitoring Worker] Worker error:', err);
    });

    workers.push(whatsappMonitoringWorker);

    workersInitialized = true;
    console.log('[Workers] ✅ All workers initialized');
}

export async function closeAllWorkers(): Promise<void> {
    console.log('[Workers] Closing all workers...');

    for (const worker of workers) {
        await worker.close();
    }

    workers.length = 0;
    workersInitialized = false;
    console.log('[Workers] ✅ All workers closed');
}

export function getWorkers(): Worker[] {
    return workers;
}

export function areWorkersInitialized(): boolean {
    return workersInitialized;
}
