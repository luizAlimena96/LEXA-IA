import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// GET /api/appointments
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('organizationId');

        const organizationId = user.role === 'SUPER_ADMIN' && orgId ? orgId : user.organizationId;
        if (!organizationId) {
            return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
        }

        const appointments = await prisma.appointment.findMany({
            where: { organizationId },
            include: {
                lead: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
            },
            orderBy: { scheduledAt: 'desc' },
        });

        return NextResponse.json(appointments);
    } catch (error) {
        return handleError(error);
    }
}

// POST /api/appointments
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();
        const { title, scheduledAt, type, notes, leadId, organizationId } = body;

        if (!title || !scheduledAt || !organizationId) {
            throw new ValidationError('Title, scheduledAt, and organizationId are required');
        }

        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== organizationId) {
            throw new ValidationError('No permission');
        }

        const appointment = await prisma.appointment.create({
            data: {
                title,
                scheduledAt: new Date(scheduledAt),
                type,
                notes,
                leadId,
                organizationId,
            },
            include: {
                lead: true,
            },
        });

        return NextResponse.json(appointment, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}

// PUT /api/appointments?id=xxx
export async function PUT(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const body = await request.json();

        if (!id) {
            throw new ValidationError('ID is required');
        }

        // Verify ownership
        const existing = await prisma.appointment.findUnique({
            where: { id },
            select: { organizationId: true },
        });

        if (!existing) {
            throw new ValidationError('Appointment not found');
        }

        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== existing.organizationId) {
            throw new ValidationError('No permission');
        }

        const appointment = await prisma.appointment.update({
            where: { id },
            data: {
                title: body.title,
                scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
                type: body.type,
                notes: body.notes,
                status: body.status,
            },
        });

        return NextResponse.json(appointment);
    } catch (error) {
        return handleError(error);
    }
}

// DELETE /api/appointments?id=xxx
export async function DELETE(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            throw new ValidationError('ID is required');
        }

        // Verify ownership
        const existing = await prisma.appointment.findUnique({
            where: { id },
            select: { organizationId: true },
        });

        if (!existing) {
            throw new ValidationError('Appointment not found');
        }

        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== existing.organizationId) {
            throw new ValidationError('No permission');
        }

        await prisma.appointment.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
