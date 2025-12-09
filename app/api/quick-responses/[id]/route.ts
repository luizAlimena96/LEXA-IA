import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// GET /api/quick-responses/[id] - Get a single quick response
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        const quickResponse = await prisma.quickResponse.findUnique({
            where: { id },
        });

        if (!quickResponse) {
            throw new ValidationError('Quick response not found');
        }

        // Check permissions
        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== quickResponse.organizationId) {
            throw new ValidationError('No permission to access this quick response');
        }

        return NextResponse.json(quickResponse);
    } catch (error) {
        return handleError(error);
    }
}

// PUT /api/quick-responses/[id] - Update a quick response
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;
        const body = await request.json();

        // Find the quick response first
        const existing = await prisma.quickResponse.findUnique({
            where: { id },
            select: {
                id: true,
                organizationId: true,
            },
        });

        if (!existing) {
            throw new ValidationError('Quick response not found');
        }

        // Check permissions
        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== existing.organizationId) {
            throw new ValidationError('No permission to update this quick response');
        }

        // Build update data
        const updateData: any = {};

        if (body.name) updateData.name = body.name;
        if (body.type) {
            const validTypes = ['TEXT', 'AUDIO', 'IMAGE'];
            if (!validTypes.includes(body.type)) {
                throw new ValidationError('Type must be TEXT, AUDIO, or IMAGE');
            }
            updateData.type = body.type;
        }
        if (body.content) updateData.content = body.content;

        const updatedQuickResponse = await prisma.quickResponse.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updatedQuickResponse);
    } catch (error) {
        return handleError(error);
    }
}

// DELETE /api/quick-responses/[id] - Delete a quick response
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        // Find the quick response first
        const existing = await prisma.quickResponse.findUnique({
            where: { id },
            select: {
                id: true,
                organizationId: true,
            },
        });

        if (!existing) {
            throw new ValidationError('Quick response not found');
        }

        // Check permissions
        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== existing.organizationId) {
            throw new ValidationError('No permission to delete this quick response');
        }

        await prisma.quickResponse.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
