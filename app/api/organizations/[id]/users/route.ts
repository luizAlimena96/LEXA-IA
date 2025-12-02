import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth, canAccessOrganization } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';
import bcrypt from 'bcryptjs';

// POST /api/organizations/[id]/users - Add user to organization
// POST /api/organizations/[id]/users - Add user to organization
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id: orgId } = await params;
        const body = await request.json();
        const { name, email, password, role, allowedTabs } = body;

        if (!canAccessOrganization(user, orgId)) {
            throw new ValidationError('Sem permissão para adicionar usuários nesta organização');
        }

        if (!email || !name || !password) {
            throw new ValidationError('Nome, email e senha são obrigatórios');
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ValidationError('Usuário já existe com este email');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'USER',
                organizationId: orgId,
                allowedTabs: allowedTabs || [],
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                allowedTabs: true,
            }
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
