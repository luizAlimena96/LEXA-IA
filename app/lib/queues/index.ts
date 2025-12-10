// Queue Definitions and Configuration
// Central place to define all queues used in the application

import { Queue, QueueOptions } from 'bullmq';
import { getRedisConnection } from '../redis';

// Queue names
export const QUEUE_NAMES = {
    REMINDERS: 'reminders',
    AGENT_FOLLOWUPS: 'agent-followups',
    APPOINTMENT_REMINDERS: 'appointment-reminders',
} as const;

// Default queue options
const defaultQueueOptions: QueueOptions = {
    connection: getRedisConnection(),
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000, // Start with 2 seconds
        },
        removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
    },
};

// Queue instances
let queues: Map<string, Queue> | null = null;

export function initializeQueues(): Map<string, Queue> {
    if (queues) {
        return queues;
    }

    console.log('[Queues] Initializing queues...');

    queues = new Map();

    // Create Reminders Queue
    queues.set(
        QUEUE_NAMES.REMINDERS,
        new Queue(QUEUE_NAMES.REMINDERS, {
            ...defaultQueueOptions,
            defaultJobOptions: {
                ...defaultQueueOptions.defaultJobOptions,
                priority: 2, // Medium priority
            },
        })
    );

    // Create Agent Follow-ups Queue
    queues.set(
        QUEUE_NAMES.AGENT_FOLLOWUPS,
        new Queue(QUEUE_NAMES.AGENT_FOLLOWUPS, {
            ...defaultQueueOptions,
            defaultJobOptions: {
                ...defaultQueueOptions.defaultJobOptions,
                priority: 2, // Medium priority
            },
        })
    );

    // Create Appointment Reminders Queue
    queues.set(
        QUEUE_NAMES.APPOINTMENT_REMINDERS,
        new Queue(QUEUE_NAMES.APPOINTMENT_REMINDERS, {
            ...defaultQueueOptions,
            defaultJobOptions: {
                ...defaultQueueOptions.defaultJobOptions,
                priority: 1, // High priority (lower number = higher priority)
            },
        })
    );

    console.log('[Queues] ✅ All queues initialized');

    return queues;
}

export function getQueue(queueName: string): Queue {
    if (!queues) {
        queues = initializeQueues();
    }

    const queue = queues.get(queueName);
    if (!queue) {
        throw new Error(`Queue '${queueName}' not found`);
    }

    return queue;
}

export async function closeAllQueues(): Promise<void> {
    if (!queues) return;

    console.log('[Queues] Closing all queues...');

    for (const [name, queue] of queues.entries()) {
        await queue.close();
        console.log(`[Queues] Closed queue: ${name}`);
    }

    queues = null;
    console.log('[Queues] ✅ All queues closed');
}

export async function getQueueStats(queueName: string) {
    const queue = getQueue(queueName);
    const counts = await queue.getJobCounts();
    const isPaused = await queue.isPaused();

    return {
        name: queueName,
        counts,
        isPaused,
    };
}

export async function getAllQueuesStats() {
    const stats = [];

    for (const queueName of Object.values(QUEUE_NAMES)) {
        stats.push(await getQueueStats(queueName));
    }

    return stats;
}
