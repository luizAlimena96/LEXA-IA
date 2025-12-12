/**
 * Knowledge Search Service
 * Vector similarity search for knowledge chunks using pgvector
 */

import { prisma } from './prisma';
import { generateEmbedding, formatEmbeddingForPgvector } from './embedding-service';
import { logger } from './conditional-logger';


export interface SearchResult {
    id: string;
    content: string;
    similarity: number;
    knowledgeId: string;
    knowledgeTitle?: string;
    chunkIndex: number;
}

export interface SearchOptions {
    topK?: number;
    minSimilarity?: number;
}

/**
 * Search for relevant knowledge chunks using vector similarity
 */
export async function searchKnowledge(
    query: string,
    agentId: string,
    organizationId: string,
    openaiApiKey: string,
    options: SearchOptions = {}
): Promise<SearchResult[]> {
    const { topK = 50, minSimilarity = 0.5 } = options;

    try {
        logger.info('[Knowledge Search] Starting search...', {
            queryLength: query.length,
            agentId,
            organizationId,
            options: { topK, minSimilarity }
        });

        // Generate embedding for the query
        const embeddingResult = await generateEmbedding(query, openaiApiKey);

        if (!embeddingResult.success || !embeddingResult.embedding) {
            console.error('[Knowledge Search] Failed to generate query embedding:', embeddingResult.error);
            return [];
        }

        logger.info('[Knowledge Search] Embedding generated successfully, dimensions:', embeddingResult.embedding.length);
        logger.info('[Knowledge Search] Query embedding sample (first 5 values):', embeddingResult.embedding.slice(0, 5));

        const queryEmbedding = formatEmbeddingForPgvector(embeddingResult.embedding);
        logger.info('[Knowledge Search] Query embedding format preview:', queryEmbedding.substring(0, 100) + '...');

        // First, check if there are any chunks at all for this agent/org
        const chunkCountResult = await prisma.$queryRawUnsafe(
            `SELECT COUNT(*) as count FROM knowledge_chunks WHERE "organizationId" = $1 AND "agentId" = $2`,
            organizationId,
            agentId
        ) as Array<{ count: bigint }>;
        const chunkCount = Number(chunkCountResult[0]?.count || 0);

        logger.info('[Knowledge Search] Total chunks in DB for agent:', chunkCount);

        if (chunkCount === 0) {
            logger.info('[Knowledge Search] No knowledge chunks found for this agent. Upload knowledge first.');
            return [];
        }

        // Check how many have embeddings
        const chunksWithEmbedding = await prisma.$queryRawUnsafe(
            `SELECT COUNT(*) as count FROM knowledge_chunks WHERE "organizationId" = $1 AND "agentId" = $2 AND embedding IS NOT NULL`,
            organizationId,
            agentId
        ) as Array<{ count: number }>;
        logger.info('[Knowledge Search] Chunks with embeddings:', chunksWithEmbedding[0]?.count || 0);

        // DEBUG: Verificar formato do embedding armazenado no banco
        try {
            const storedEmbeddingSample = await prisma.$queryRawUnsafe(
                `SELECT substring(embedding::text, 1, 100) as sample FROM knowledge_chunks 
                 WHERE "organizationId" = $1 AND "agentId" = $2 AND embedding IS NOT NULL LIMIT 1`,
                organizationId,
                agentId
            ) as Array<{ sample: string }>;
            if (storedEmbeddingSample.length > 0) {
                logger.info('[Knowledge Search] Stored embedding format sample:', storedEmbeddingSample[0].sample);
            }
        } catch (e) {
            logger.info('[Knowledge Search] Could not fetch embedding sample:', e);
        }

        // Use raw SQL for vector similarity search with pgvector
        // The <=> operator is cosine distance (1 - similarity)
        // We convert to similarity by doing (1 - distance)
        const results = await prisma.$queryRawUnsafe(
            `SELECT 
        kc.id,
        kc.content,
        kc."knowledgeId" as knowledge_id,
        kc."chunkIndex" as chunk_index,
        (kc.embedding <=> $1::vector) as distance
      FROM knowledge_chunks kc
      WHERE kc."organizationId" = $2
        AND kc."agentId" = $3
        AND kc.embedding IS NOT NULL
      ORDER BY distance ASC
      LIMIT $4`,
            queryEmbedding,
            organizationId,
            agentId,
            topK
        ) as Array<{
            id: string;
            content: string;
            knowledge_id: string;
            chunk_index: number;
            distance: number;
        }>;

        logger.info('[Knowledge Search] Raw query results:', results.length, 'chunks found');
        if (results.length > 0) {
            logger.info('[Knowledge Search] Top result distance:', results[0].distance);
            logger.info('[Knowledge Search] Top result distance type:', typeof results[0].distance);
        }

        // Filter by minimum similarity and transform results
        const searchResults: SearchResult[] = [];

        for (let i = 0; i < results.length; i++) {
            const row = results[i];
            // A distância retornada pelo pgvector cosine é entre 0 e 2
            // 0 = idêntico, 2 = completamente oposto
            const distance = parseFloat(String(row.distance));
            const similarity = 1 - distance; // Convert distance to similarity

            logger.info(`[Knowledge Search] Chunk #${i + 1}:`, {
                distance: distance,
                similarity: similarity.toFixed(3),
                minRequired: minSimilarity,
                passesThreshold: similarity >= minSimilarity,
                contentPreview: row.content?.substring(0, 100) + '...'
            });

            if (similarity >= minSimilarity) {
                // Get knowledge title
                const knowledge = await prisma.knowledge.findUnique({
                    where: { id: row.knowledge_id },
                    select: { title: true },
                });

                searchResults.push({
                    id: row.id,
                    content: row.content,
                    similarity,
                    knowledgeId: row.knowledge_id,
                    knowledgeTitle: knowledge?.title,
                    chunkIndex: row.chunk_index,
                });
            }
        }

        logger.info(`[Knowledge Search] ${searchResults.length} chunks passed similarity threshold`);

        return searchResults;
    } catch (error: any) {
        console.error('[Knowledge Search] Error:', error);
        return [];
    }
}

/**
 * Format search results as context for AI prompts
 */
export function formatKnowledgeContext(results: SearchResult[]): string {
    if (results.length === 0) {
        return '';
    }

    const contextParts = results.map((result, index) => {
        const source = result.knowledgeTitle
            ? `[Fonte: ${result.knowledgeTitle}]`
            : `[Chunk ${result.chunkIndex + 1}]`;

        return `--- Conhecimento ${index + 1} ${source} ---\n${result.content}`;
    });

    return `\n\n# BASE DE CONHECIMENTO RELEVANTE\n\n${contextParts.join('\n\n')}`;
}

/**
 * Get statistics about the knowledge base for an agent
 */
export async function getKnowledgeStats(
    agentId: string,
    organizationId: string
): Promise<{ totalChunks: number; chunksWithEmbeddings: number; embeddingModel: string }> {
    try {
        // Count total chunks
        const totalResult = await prisma.$queryRawUnsafe(
            `SELECT COUNT(*) as count FROM knowledge_chunks WHERE "organizationId" = $1 AND "agentId" = $2`,
            organizationId,
            agentId
        ) as Array<{ count: bigint }>;
        const totalChunks = Number(totalResult[0]?.count || 0);

        // Count chunks with embeddings
        const embeddingResult = await prisma.$queryRawUnsafe(
            `SELECT COUNT(*) as count FROM knowledge_chunks WHERE "organizationId" = $1 AND "agentId" = $2 AND embedding IS NOT NULL`,
            organizationId,
            agentId
        ) as Array<{ count: bigint }>;
        const chunksWithEmbeddings = Number(embeddingResult[0]?.count || 0);

        return {
            totalChunks,
            chunksWithEmbeddings,
            embeddingModel: 'text-embedding-3-small', // O modelo usado no sistema
        };
    } catch (error) {
        console.error('[Knowledge Search] Error getting stats:', error);
        return {
            totalChunks: 0,
            chunksWithEmbeddings: 0,
            embeddingModel: 'text-embedding-3-small',
        };
    }
}
