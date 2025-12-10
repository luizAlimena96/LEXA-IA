import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';

// GET /api/response-templates - List templates
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const orgId = searchParams.get('organizationId');

        // Determine organization
        const organizationId = user.role === 'SUPER_ADMIN' && orgId
            ? orgId
            : user.organizationId;

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Organization ID required' },
                { status: 400 }
            );
        }

        const where: any = {
            OR: [
                { organizationId },
                { isDefault: true },
            ],
        };

        if (category) {
            where.category = category;
        }

        const templates = await prisma.responseTemplate.findMany({
            where,
            orderBy: [
                { category: 'asc' },
                { name: 'asc' },
            ],
        });

        return NextResponse.json(templates);
    } catch (error) {
        return handleError(error);
    }
}

// POST /api/response-templates - Create template
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();
        const { name, category, content, variables } = body;

        if (!name || !category || !content) {
            return NextResponse.json(
                { error: 'Name, category, and content are required' },
                { status: 400 }
            );
        }

        const organizationId = user.organizationId;
        if (!organizationId) {
            return NextResponse.json(
                { error: 'Organization ID required' },
                { status: 400 }
            );
        }

        const template = await prisma.responseTemplate.create({
            data: {
                name,
                category,
                content,
                variables: variables || [],
                organizationId,
                isDefault: false,
            },
        });

        return NextResponse.json(template, { status: 201 });
    } catch (error) {
        return handleError(error);
    }
}
