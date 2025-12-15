import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';

// GET /api/tags
export async function GET(request: NextRequest) {
    try {
        // Authentication handled by backend
        const searchParams = request.nextUrl.searchParams;
        const organizationId = searchParams.get('organizationId');

        const tags = await prisma.tag.findMany({
            where: organizationId ? { organizationId } : {},
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(tags);
    } catch (error) {
        return handleError(error);
    }
}

// POST /api/tags
export async function POST(request: NextRequest) {
    try {
        // Authentication handled by backend
        const body = await request.json();
        const { name, color, organizationId } = body;

        if (!name) {
            throw new ValidationError('Nome da tag é obrigatório');
        }

        if (!organizationId) {
            throw new ValidationError('Organização não identificada');
        }

        const tag = await prisma.tag.create({
            data: {
                name,
                color: color || '#6366f1',
                organizationId,
            }
        });

        return NextResponse.json(tag, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
