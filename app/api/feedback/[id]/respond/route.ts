import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireAuth } from '@/app/lib/auth';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        const formData = await request.formData();
        const response = formData.get('response') as string;

        if (!response) {
            return NextResponse.json(
                { error: 'Response text is required' },
                { status: 400 }
            );
        }

        // Update feedback with response
        const feedback = await prisma.feedback.update({
            where: { id },
            data: {
                response,
                status: 'RESPONDED',
                respondedAt: new Date(),
                respondedBy: user.id,
            },
        });


        return NextResponse.json(feedback);
    } catch (error) {
        console.error('Error responding to feedback:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
