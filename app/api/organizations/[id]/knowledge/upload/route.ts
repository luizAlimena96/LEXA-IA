import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// POST - Upload CSV and update knowledge base
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orgId } = await params;
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const text = await file.text();
        const lines = text.split('\n').filter((line) => line.trim());

        if (lines.length < 2) {
            return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
        }

        // Parse CSV (simple implementation)
        const headers = lines[0].split(',').map((h) => h.trim());
        const titleIndex = headers.indexOf('title');
        const contentIndex = headers.indexOf('content');
        const typeIndex = headers.indexOf('type');

        if (titleIndex === -1 || contentIndex === -1) {
            return NextResponse.json(
                { error: 'CSV must have title and content columns' },
                { status: 400 }
            );
        }

        // Get agent for this organization
        const agent = await prisma.agent.findFirst({
            where: { organizationId: orgId },
        });

        if (!agent) {
            return NextResponse.json({ error: 'No agent found' }, { status: 404 });
        }

        // Delete existing knowledge
        await prisma.knowledge.deleteMany({
            where: { agentId: agent.id },
        });

        // Create new knowledge items
        const knowledgeItems = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map((v) => v.trim());

            if (values.length >= 2) {
                knowledgeItems.push({
                    title: values[titleIndex] || `Item ${i}`,
                    content: values[contentIndex] || '',
                    type: (typeIndex !== -1 ? values[typeIndex] : 'FAQ') as any,
                    agentId: agent.id,
                    organizationId: orgId,
                });
            }
        }

        await prisma.knowledge.createMany({
            data: knowledgeItems,
        });

        return NextResponse.json({
            success: true,
            count: knowledgeItems.length,
        });
    } catch (error) {
        console.error('Error uploading knowledge:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
