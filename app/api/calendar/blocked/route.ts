import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, getOrganizationFilter } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// GET /api/calendar/blocked
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const searchParams = request.nextUrl.searchParams;
        const organizationId = searchParams.get('organizationId');

        // Optional date range filtering
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        const orgFilter = getOrganizationFilter(user, organizationId);

        const where: any = {
            ...orgFilter,
        };

        if (start && end) {
            where.OR = [
                {
                    startTime: {
                        gte: new Date(start),
                        lte: new Date(end),
                    }
                },
                {
                    endTime: {
                        gte: new Date(start),
                        lte: new Date(end),
                    }
                },
                {
                    startTime: { lte: new Date(start) },
                    endTime: { gte: new Date(end) }
                }
            ];
        }

        const blockedSlots = await prisma.blockedSlot.findMany({
            where,
            orderBy: { startTime: 'asc' }
        });

        return NextResponse.json(blockedSlots);
    } catch (error) {
        return handleError(error);
    }
}

// POST /api/calendar/blocked
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();
        const { startTime, endTime, title, allDay, organizationId } = body;

        if (!startTime || !endTime) {
            throw new ValidationError('Data de início e fim são obrigatórias');
        }

        // Determine organization ID
        let targetOrgId = user.organizationId;
        if (user.role === 'SUPER_ADMIN' && organizationId) {
            targetOrgId = organizationId;
        }

        if (!targetOrgId) {
            throw new ValidationError('Organização não identificada');
        }

        const blockedSlot = await prisma.blockedSlot.create({
            data: {
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                title,
                allDay: allDay || false,
                organizationId: targetOrgId,
            }
        });

        return NextResponse.json(blockedSlot, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
