// API Route: /api/agents/[id]/auto-scheduling/[configId]/reminders/[reminderId]
// Manage individual reminder config

import { NextRequest, NextResponse } from 'next/server';
import {
    updateReminderConfig,
    deleteReminderConfig,
    type CreateReminderConfigInput,
} from '@/app/services/appointmentReminderService';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; configId: string; reminderId: string }> }
) {
    try {
        // Authentication handled by backend
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { reminderId } = await params;
        const body: Partial<CreateReminderConfigInput> = await request.json();

        const reminder = await updateReminderConfig(reminderId, body);
        return NextResponse.json(reminder);
    } catch (error: any) {
        console.error('Error updating reminder:', error);

        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
        }

        return NextResponse.json(
            { error: 'Failed to update reminder' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; configId: string; reminderId: string }> }
) {
    try {
        // Authentication handled by backend
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { reminderId } = await params;

        await deleteReminderConfig(reminderId);
        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        console.error('Error deleting reminder:', error);

        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
        }

        return NextResponse.json(
            { error: 'Failed to delete reminder' },
            { status: 500 }
        );
    }
}
