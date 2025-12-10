// Agent Follow-ups Job Processor
// Processes agent follow-up jobs from the queue

import { Job } from 'bullmq';
import { checkAgentFollowUps } from '@/app/services/agentFollowupService';

export interface AgentFollowupsJobData {
    // No specific data needed for this job
    triggeredAt: Date;
}

export async function processAgentFollowupsJob(job: Job<AgentFollowupsJobData>): Promise<number> {
    console.log(`[Agent Follow-ups Job] Processing job ${job.id}...`);

    try {
        const processedCount = await checkAgentFollowUps();
        console.log(`[Agent Follow-ups Job] ✅ Job ${job.id} completed. Processed ${processedCount} follow-ups`);
        return processedCount;
    } catch (error) {
        console.error(`[Agent Follow-ups Job] ❌ Job ${job.id} failed:`, error);
        throw error; // Re-throw to trigger retry
    }
}
