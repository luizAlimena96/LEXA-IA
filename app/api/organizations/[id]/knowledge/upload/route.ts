import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { processPDF, isPDF } from '@/app/lib/pdf-processor';
import { generateBatchEmbeddings, formatEmbeddingForPgvector } from '@/app/lib/embedding-service';

// POST - Upload PDF/CSV and update knowledge base
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orgId } = await params;
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!title || title.trim().length === 0) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        console.log('[Knowledge Upload] Processing file:', file.name, 'Type:', file.type);

        // Get organization and agent
        const organization = await prisma.organization.findUnique({
            where: { id: orgId },
            select: { openaiApiKey: true },
        });

        if (!organization?.openaiApiKey) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 400 });
        }

        const agent = await prisma.agent.findFirst({
            where: { organizationId: orgId },
        });

        if (!agent) {
            return NextResponse.json({ error: 'No agent found' }, { status: 404 });
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Detect file type
        const isPDFFile = file.name.toLowerCase().endsWith('.pdf') || isPDF(buffer);

        if (isPDFFile) {
            console.log('[Knowledge Upload] Processing as PDF...');
            return await processPDFUpload(buffer, title, agent.id, orgId, organization.openaiApiKey);
        } else {
            console.log('[Knowledge Upload] Processing as CSV...');
            return await processCSVUpload(buffer, agent.id, orgId);
        }
    } catch (error) {
        console.error('[Knowledge Upload] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * Process PDF upload with chunking and embeddings
 */
async function processPDFUpload(
    buffer: Buffer,
    title: string,
    agentId: string,
    organizationId: string,
    openaiApiKey: string
) {
    try {
        // Process PDF
        const pdfResult = await processPDF(buffer);

        if (!pdfResult.success || !pdfResult.chunks) {
            return NextResponse.json(
                { error: pdfResult.error || 'Failed to process PDF' },
                { status: 400 }
            );
        }

        console.log('[Knowledge Upload] PDF processed:', {
            pages: pdfResult.metadata?.pages,
            chunks: pdfResult.chunks.totalChunks,
            avgTokens: pdfResult.chunks.averageTokensPerChunk,
        });

        // Create Knowledge entry
        const knowledge = await prisma.knowledge.create({
            data: {
                title: title.trim(),
                content: pdfResult.cleanText || '',
                type: 'DOCUMENT',
                fileName: title,
                fileSize: buffer.length,
                agentId,
                organizationId,
            },
        });

        console.log('[Knowledge Upload] Knowledge entry created:', knowledge.id);

        // Generate embeddings for all chunks in batch
        const chunkContents = pdfResult.chunks.chunks.map(c => c.content);
        console.log('[Knowledge Upload] Generating embeddings for', chunkContents.length, 'chunks...');

        const embeddingResult = await generateBatchEmbeddings(chunkContents, openaiApiKey);

        if (!embeddingResult.success || !embeddingResult.embeddings) {
            console.error('[Knowledge Upload] Failed to generate embeddings:', embeddingResult.error);
            // Delete the knowledge entry if embeddings fail
            await prisma.knowledge.delete({ where: { id: knowledge.id } });
            return NextResponse.json(
                { error: 'Failed to generate embeddings' },
                { status: 500 }
            );
        }

        console.log('[Knowledge Upload] Embeddings generated successfully');

        // Create chunks with embeddings using raw SQL for better performance
        const chunkInserts = pdfResult.chunks.chunks.map((chunk, index) => {
            const embedding = embeddingResult.embeddings![index];
            const embeddingStr = formatEmbeddingForPgvector(embedding);

            return prisma.$executeRawUnsafe(
                `INSERT INTO knowledge_chunks (id, "knowledgeId", content, embedding, "chunkIndex", "organizationId", "agentId", "createdAt")
                 VALUES (gen_random_uuid(), $1, $2, $3::vector, $4, $5, $6, NOW())`,
                knowledge.id,
                chunk.content,
                embeddingStr,
                chunk.index,
                organizationId,
                agentId
            );
        });

        await Promise.all(chunkInserts);

        console.log('[Knowledge Upload] All chunks saved with embeddings');

        return NextResponse.json({
            success: true,
            knowledgeId: knowledge.id,
            chunks: pdfResult.chunks.totalChunks,
            pages: pdfResult.metadata?.pages,
            averageTokensPerChunk: pdfResult.chunks.averageTokensPerChunk,
        });
    } catch (error: any) {
        console.error('[Knowledge Upload] Error processing PDF:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process PDF' },
            { status: 500 }
        );
    }
}

/**
 * Process CSV upload (legacy format)
 */
async function processCSVUpload(buffer: Buffer, agentId: string, organizationId: string) {
    try {
        const text = buffer.toString('utf-8');
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

        // Delete existing knowledge for this agent
        await prisma.knowledge.deleteMany({
            where: { agentId },
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
                    agentId,
                    organizationId,
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
    } catch (error: any) {
        console.error('[Knowledge Upload] Error processing CSV:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process CSV' },
            { status: 500 }
        );
    }
}
