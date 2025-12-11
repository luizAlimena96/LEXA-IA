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

        // Create feedback response
        const feedbackResponse = await prisma.feedbackResponse.create({
            data: {
                feedbackId: id,
                message: response,
                userId: user.id,
                userName: user.name,
            },
        });

        return NextResponse.json(feedbackResponse);
    } catch (error) {
        console.error('Error responding to feedback:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
