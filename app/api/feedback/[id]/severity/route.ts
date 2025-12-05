import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;
        const { severity } = await request.json();

        if (!severity || !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(severity)) {
            return NextResponse.json(
                { error: 'Invalid severity value' },
                { status: 400 }
            );
        }

        // Update feedback severity
        const feedback = await prisma.feedback.update({
            where: { id },
            data: { severity },
        });

        return NextResponse.json(feedback);
    } catch (error) {
        console.error('Error updating feedback severity:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
