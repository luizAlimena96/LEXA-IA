/**
 * Knowledge Upload API
 * Handles file uploads, text extraction, chunking, and embedding generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getOrganizationIdForCreate } from '@/app/lib/auth';
import { handleError } from '@/app/lib/error-handler';
import { ValidationError } from '@/app/lib/errors';
import { prisma } from '@/app/lib/prisma';
import { parseDocument, isValidFileType } from '@/app/lib/document-parser';
import { generateBatchEmbeddings, formatEmbeddingForPgvector } from '@/app/lib/embedding-service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();

        // Parse multipart form data
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const title = formData.get('title') as string | null;
        const agentId = formData.get('agentId') as string | null;
        const requestedOrgId = formData.get('organizationId') as string | null;

        // Validations
        if (!file) {
            throw new ValidationError('Arquivo é obrigatório');
        }

        if (!title || !title.trim()) {
            throw new ValidationError('Título é obrigatório');
        }

        if (!agentId) {
            throw new ValidationError('AgentId é obrigatório');
        }

        // Validate file type
        if (!isValidFileType(file.name, file.type)) {
            throw new ValidationError('Tipo de arquivo não suportado. Use PDF, TXT ou DOC/DOCX');
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            throw new ValidationError(`Arquivo muito grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        }

        // Verify agent exists and get organization
        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
            include: { organization: true },
        });

        if (!agent) {
            throw new ValidationError('Agente não encontrado');
        }

        // Determine organization ID (use agent's org for Super Admin in "All Orgs" mode)
        const organizationId = getOrganizationIdForCreate(
            user,
            requestedOrgId || agent.organizationId
        );

        // Get OpenAI API key
        const openaiApiKey = agent.organization?.openaiApiKey || process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            throw new ValidationError('Chave da OpenAI não configurada');
        }

        // Read file buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse document
        const parseResult = await parseDocument(buffer, file.name, file.type);

        if (!parseResult.success) {
            throw new ValidationError(parseResult.error || 'Erro ao processar documento');
        }

        if (parseResult.chunks.length === 0) {
            throw new ValidationError('Documento não contém texto extraível');
        }

        // Generate embeddings for all chunks
        const embeddingResult = await generateBatchEmbeddings(parseResult.chunks, openaiApiKey);

        if (!embeddingResult.success || !embeddingResult.embeddings) {
            console.error('[Knowledge Upload] Embedding generation failed:', embeddingResult.error);
            // Continue without embeddings - they can be generated later
        }

        // Create Knowledge record first
        const knowledge = await prisma.knowledge.create({
            data: {
                title: title.trim(),
                content: parseResult.text.slice(0, 50000), // Store first 50k chars as summary
                type: 'DOCUMENT',
                fileName: file.name,
                fileSize: file.size,
                agentId,
                organizationId,
            },
        });

        // Helper function for delay
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // Create chunks with embeddings - FORA da transação e com delays para evitar pool overflow
        let successfulChunks = 0;
        const BATCH_SIZE = 5; // Processar em batches de 5

        for (let i = 0; i < parseResult.chunks.length; i++) {
            const chunk = parseResult.chunks[i];
            const embedding = embeddingResult.embeddings?.[i];

            try {
                if (embedding) {
                    // Use raw SQL for inserting vector
                    const embeddingStr = formatEmbeddingForPgvector(embedding);
                    await prisma.$executeRawUnsafe(
                        `INSERT INTO knowledge_chunks (id, "knowledgeId", content, embedding, "chunkIndex", "organizationId", "agentId", "createdAt")
             VALUES (gen_random_uuid(), $1, $2, $3::vector, $4, $5, $6, NOW())`,
                        knowledge.id,
                        chunk,
                        embeddingStr,
                        i,
                        organizationId,
                        agentId
                    );
                } else {
                    // Create chunk without embedding
                    await prisma.$executeRawUnsafe(
                        `INSERT INTO knowledge_chunks (id, "knowledgeId", content, "chunkIndex", "organizationId", "agentId", "createdAt")
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
                        knowledge.id,
                        chunk,
                        i,
                        organizationId,
                        agentId
                    );
                }
                successfulChunks++;

                // Pequeno delay a cada batch para não sobrecarregar o pool
                if ((i + 1) % BATCH_SIZE === 0) {
                    await delay(50); // 50ms de delay a cada 5 chunks
                }
            } catch (chunkError) {
                console.error(`[Knowledge Upload] Error inserting chunk ${i}:`, chunkError);
                // Continua mesmo se um chunk falhar
            }
        }

        console.log(`[Knowledge Upload] Inserted ${successfulChunks}/${parseResult.chunks.length} chunks for knowledge ${knowledge.id}`);

        return NextResponse.json({
            success: true,
            knowledge: {
                id: knowledge.id,
                title: knowledge.title,
                fileName: knowledge.fileName,
                fileSize: knowledge.fileSize,
            },
            chunks: {
                total: parseResult.chunks.length,
                withEmbeddings: embeddingResult.embeddings?.length || 0,
            },
            metadata: parseResult.metadata,
        }, { status: 201 });

    } catch (error) {
        return handleError(error);
    }
}
