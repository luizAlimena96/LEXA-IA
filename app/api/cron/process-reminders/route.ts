// API Route: /api/cron/process-reminders
// Cron job endpoint to process pending reminders

import { NextRequest, NextResponse } from 'next/server';
import { processPendingReminders } from '@/app/services/appointmentReminderService';

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret (optional but recommended)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const processed = await processPendingReminders();

        return NextResponse.json({
            success: true,
            processed,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error processing reminders:', error);
        return NextResponse.json(
            { error: 'Failed to process reminders' },
            { status: 500 }
        );
    }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
    return GET(request);
}
