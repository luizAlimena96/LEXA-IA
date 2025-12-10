import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';

// PATCH /api/response-templates/:id - Update template
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id: templateId } = await params;
        const body = await request.json();

        // Get template to check permissions
        const template = await prisma.responseTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        // Can't edit default templates unless SUPER_ADMIN
        if (template.isDefault && user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Cannot edit default templates' },
                { status: 403 }
            );
        }

        // Check organization permission
        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== template.organizationId) {
            return NextResponse.json(
                { error: 'No permission' },
                { status: 403 }
            );
        }

        const updatedTemplate = await prisma.responseTemplate.update({
            where: { id: templateId },
            data: {
                name: body.name,
                category: body.category,
                content: body.content,
                variables: body.variables,
            },
        });

        return NextResponse.json(updatedTemplate);
    } catch (error) {
        return handleError(error);
    }
}

// DELETE /api/response-templates/:id - Delete template
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id: templateId } = await params;

        const template = await prisma.responseTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        // Cannot delete default templates
        if (template.isDefault) {
            return NextResponse.json(
                { error: 'Cannot delete default templates' },
                { status: 403 }
            );
        }

        // Check organization permission
        if (user.role !== 'SUPER_ADMIN' && user.organizationId !== template.organizationId) {
            return NextResponse.json(
                { error: 'No permission' },
                { status: 403 }
            );
        }

        await prisma.responseTemplate.delete({
            where: { id: templateId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
