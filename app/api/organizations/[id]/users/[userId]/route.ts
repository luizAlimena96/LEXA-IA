import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, canAccessOrganization } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError, NotFoundError } from '@/app/lib/errors';
import bcrypt from 'bcryptjs';

// PUT /api/organizations/[id]/users/[userId] - Update user
// PUT /api/organizations/[id]/users/[userId] - Update user
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> }
) {
    try {
        const currentUser = await requireAuth();
        const { id: orgId, userId } = await params;
        const body = await request.json();

        if (!canAccessOrganization(currentUser, orgId)) {
            throw new ValidationError('Sem permissão');
        }

        // Only Admin/SuperAdmin can manage users
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
            throw new ValidationError('Apenas administradores podem gerenciar usuários');
        }

        const dataToUpdate: any = {};
        if (body.name) dataToUpdate.name = body.name;
        if (body.role) dataToUpdate.role = body.role;
        if (body.allowedTabs) dataToUpdate.allowedTabs = body.allowedTabs;
        if (body.password) {
            dataToUpdate.password = await bcrypt.hash(body.password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId, organizationId: orgId },
            data: dataToUpdate,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                allowedTabs: true,
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        return handleError(error);
    }
}

// DELETE /api/organizations/[id]/users/[userId] - Delete user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> }
) {
    try {
        const currentUser = await requireAuth();
        const { id: orgId, userId } = await params;

        if (!canAccessOrganization(currentUser, orgId)) {
            throw new ValidationError('Sem permissão');
        }

        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
            throw new ValidationError('Apenas administradores podem gerenciar usuários');
        }

        if (currentUser.id === userId) {
            throw new ValidationError('Não é possível excluir a si mesmo');
        }

        await prisma.user.delete({
            where: { id: userId, organizationId: orgId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleError(error);
    }
}
