// Agent Follow-up Service
// Handles checking and processing agent follow-ups

import { prisma } from '@/app/lib/prisma';
import apiClient from '@/app/lib/api-client';

export async function checkAgentFollowUps() {
    try {
        console.log('[Agent Follow-up Service] Calling backend API...');
        const response = await apiClient.post('/followups/check');
        console.log(`[Agent Follow-up Service] Backend processed ${response.data.processed} follow-ups`);
        return response.data.processed;
    } catch (error) {
        console.error('[Agent Follow-up Service] Error calling backend:', error);
        throw error;
    }
}
