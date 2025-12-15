// API Route: /api/agents/[id]/auto-scheduling/[configId]/reminders
// Manage reminder configurations

import { NextRequest, NextResponse } from 'next/server';
import {
    getReminderConfigs,
    createReminderConfig,
    type CreateReminderConfigInput,
} from '@/app/services/appointmentReminderService';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; configId: string }> }
) {
    try {
        // Authentication handled by backend
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { configId } = await params;

        const reminders = await getReminderConfigs(configId);
        return NextResponse.json(reminders);
    } catch (error) {
        console.error('Error fetching reminders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reminders' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; configId: string }> }
) {
    try {
        // Authentication handled by backend
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { configId } = await params;
        const body: CreateReminderConfigInput = await request.json();

        // Validate
        if (!body.minutesBefore || !body.leadMessageTemplate) {
            return NextResponse.json(
                { error: 'minutesBefore and leadMessageTemplate are required' },
                { status: 400 }
            );
        }

        const reminder = await createReminderConfig(configId, body);
        return NextResponse.json(reminder, { status: 201 });
    } catch (error) {
        console.error('Error creating reminder:', error);
        return NextResponse.json(
            { error: 'Failed to create reminder' },
            { status: 500 }
        );
    }
}
