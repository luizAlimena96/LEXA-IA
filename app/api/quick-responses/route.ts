import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// GET /api/quick-responses - List quick responses for organization
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('organizationId');

        // Determine which organization to query
        const organizationId = user.role === 'SUPER_ADMIN' && orgId
            ? orgId
            : user.organizationId;

        if (!organizationId) {
            throw new ValidationError('Organization ID is required');
        }

        const quickResponses = await prisma.quickResponse.findMany({
            where: {
                organizationId,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(quickResponses);
    } catch (error) {
        return handleError(error);
    }
}

// POST /api/quick-responses - Create a new quick response
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();
        const { name, type, content, organizationId: reqOrgId } = body;

        if (!name || !type || !content) {
            throw new ValidationError('Name, type, and content are required');
        }

        // Validate type
        const validTypes = ['TEXT', 'AUDIO', 'IMAGE'];
        if (!validTypes.includes(type)) {
            throw new ValidationError('Type must be TEXT, AUDIO, or IMAGE');
        }

        // Determine organization
        const organizationId = user.role === 'SUPER_ADMIN' && reqOrgId
            ? reqOrgId
            : user.organizationId;

        if (!organizationId) {
            throw new ValidationError('Organization ID is required');
        }

        // Check permissions
        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== organizationId) {
            throw new ValidationError('No permission');
        }

        const quickResponse = await prisma.quickResponse.create({
            data: {
                name,
                type,
                content,
                organizationId,
            },
        });

        return NextResponse.json(quickResponse, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
