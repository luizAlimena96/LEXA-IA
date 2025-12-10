/**
 * Embedding Service
 * Generates embeddings using OpenAI's text-embedding-ada-002 model
 */

import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

export interface EmbeddingResult {
    success: boolean;
    embedding?: number[];
    error?: string;
}

export interface BatchEmbeddingResult {
    success: boolean;
    embeddings?: number[][];
    error?: string;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(
    text: string,
    openaiApiKey: string
): Promise<EmbeddingResult> {
    try {
        if (!text || !text.trim()) {
            return {
                success: false,
                error: 'Texto vazio não pode gerar embedding',
            };
        }

        const openai = new OpenAI({ apiKey: openaiApiKey });

        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: text.trim(),
            dimensions: EMBEDDING_DIMENSIONS,
        });

        const embedding = response.data[0]?.embedding;

        if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
            return {
                success: false,
                error: 'Embedding inválido retornado pela API',
            };
        }

        return {
            success: true,
            embedding,
        };
    } catch (error: any) {
        console.error('[Embedding Service] Error generating embedding:', error);
        return {
            success: false,
            error: error.message || 'Erro ao gerar embedding',
        };
    }
}

/**
 * Generate embeddings for multiple texts (batch)
 * More efficient than calling one by one
 */
export async function generateBatchEmbeddings(
    texts: string[],
    openaiApiKey: string
): Promise<BatchEmbeddingResult> {
    try {
        if (!texts || texts.length === 0) {
            return {
                success: false,
                error: 'Lista de textos vazia',
            };
        }

        // Filter out empty texts
        const validTexts = texts.map(t => t.trim()).filter(t => t.length > 0);

        if (validTexts.length === 0) {
            return {
                success: false,
                error: 'Todos os textos estão vazios',
            };
        }

        const openai = new OpenAI({ apiKey: openaiApiKey });

        // OpenAI supports batch embedding - more efficient
        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: validTexts,
            dimensions: EMBEDDING_DIMENSIONS,
        });

        const embeddings = response.data.map(item => item.embedding);

        // Validate all embeddings
        for (const embedding of embeddings) {
            if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
                return {
                    success: false,
                    error: 'Um ou mais embeddings inválidos retornados pela API',
                };
            }
        }

        return {
            success: true,
            embeddings,
        };
    } catch (error: any) {
        console.error('[Embedding Service] Error generating batch embeddings:', error);
        return {
            success: false,
            error: error.message || 'Erro ao gerar embeddings em batch',
        };
    }
}

/**
 * Format embedding array for pgvector insertion
 * pgvector expects format: '[0.1, 0.2, ...]'
 */
export function formatEmbeddingForPgvector(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
}
