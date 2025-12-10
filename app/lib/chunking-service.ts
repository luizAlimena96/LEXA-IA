/**
 * Chunking Service
 * Intelligent semantic text chunking with token-aware splitting
 */

import { encoding_for_model } from 'tiktoken';

const CHUNK_SIZE = 500; // Target tokens per chunk
const CHUNK_OVERLAP = 100; // Overlap tokens between chunks
const MIN_CHUNK_SIZE = 100; // Minimum chunk size

export interface TextChunk {
    content: string;
    index: number;
    tokenCount: number;
    startChar: number;
    endChar: number;
}

export interface ChunkingResult {
    chunks: TextChunk[];
    totalChunks: number;
    totalTokens: number;
    averageTokensPerChunk: number;
}

/**
 * Count tokens in text using tiktoken (same tokenizer as OpenAI)
 */
function countTokens(text: string): number {
    try {
        const encoder = encoding_for_model('text-embedding-3-small');
        const tokens = encoder.encode(text);
        const count = tokens.length;
        encoder.free();
        return count;
    } catch (error) {
        // Fallback: rough estimate (1 token ≈ 4 characters)
        return Math.ceil(text.length / 4);
    }
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
    // Split on sentence boundaries while preserving the delimiter
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences.map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Split text into paragraphs
 */
function splitIntoParagraphs(text: string): string[] {
    return text
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);
}

/**
 * Create chunks from text with semantic awareness
 */
export function chunkText(text: string): ChunkingResult {
    if (!text || text.trim().length === 0) {
        return {
            chunks: [],
            totalChunks: 0,
            totalTokens: 0,
            averageTokensPerChunk: 0,
        };
    }

    const cleanText = text.trim();
    const paragraphs = splitIntoParagraphs(cleanText);
    const chunks: TextChunk[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    let charPosition = 0;

    for (const paragraph of paragraphs) {
        const paragraphTokens = countTokens(paragraph);

        // If paragraph itself is too large, split by sentences
        if (paragraphTokens > CHUNK_SIZE) {
            // Save current chunk if it exists
            if (currentChunk.length > 0) {
                chunks.push({
                    content: currentChunk.trim(),
                    index: chunks.length,
                    tokenCount: currentTokens,
                    startChar: charPosition - currentChunk.length,
                    endChar: charPosition,
                });
                currentChunk = '';
                currentTokens = 0;
            }

            // Split large paragraph into sentences
            const sentences = splitIntoSentences(paragraph);
            let sentenceBuffer = '';
            let sentenceTokens = 0;

            for (const sentence of sentences) {
                const sentenceTokenCount = countTokens(sentence);

                if (sentenceTokens + sentenceTokenCount > CHUNK_SIZE && sentenceBuffer.length > 0) {
                    // Save current sentence buffer as chunk
                    chunks.push({
                        content: sentenceBuffer.trim(),
                        index: chunks.length,
                        tokenCount: sentenceTokens,
                        startChar: charPosition - sentenceBuffer.length,
                        endChar: charPosition,
                    });

                    // Start new buffer with overlap from previous chunk
                    const overlapText = getOverlapText(sentenceBuffer, CHUNK_OVERLAP);
                    sentenceBuffer = overlapText + ' ' + sentence;
                    sentenceTokens = countTokens(sentenceBuffer);
                } else {
                    sentenceBuffer += (sentenceBuffer ? ' ' : '') + sentence;
                    sentenceTokens += sentenceTokenCount;
                }

                charPosition += sentence.length + 1;
            }

            // Add remaining sentences as chunk
            if (sentenceBuffer.length > 0) {
                chunks.push({
                    content: sentenceBuffer.trim(),
                    index: chunks.length,
                    tokenCount: sentenceTokens,
                    startChar: charPosition - sentenceBuffer.length,
                    endChar: charPosition,
                });
            }
        } else {
            // Check if adding this paragraph exceeds chunk size
            if (currentTokens + paragraphTokens > CHUNK_SIZE && currentChunk.length > 0) {
                // Save current chunk
                chunks.push({
                    content: currentChunk.trim(),
                    index: chunks.length,
                    tokenCount: currentTokens,
                    startChar: charPosition - currentChunk.length,
                    endChar: charPosition,
                });

                // Start new chunk with overlap
                const overlapText = getOverlapText(currentChunk, CHUNK_OVERLAP);
                currentChunk = overlapText + '\n\n' + paragraph;
                currentTokens = countTokens(currentChunk);
            } else {
                // Add paragraph to current chunk
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
                currentTokens += paragraphTokens;
            }

            charPosition += paragraph.length + 2; // +2 for \n\n
        }
    }

    // Add final chunk if it exists and meets minimum size
    if (currentChunk.length > 0 && currentTokens >= MIN_CHUNK_SIZE) {
        chunks.push({
            content: currentChunk.trim(),
            index: chunks.length,
            tokenCount: currentTokens,
            startChar: charPosition - currentChunk.length,
            endChar: charPosition,
        });
    }

    const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0);
    const averageTokens = chunks.length > 0 ? totalTokens / chunks.length : 0;

    return {
        chunks,
        totalChunks: chunks.length,
        totalTokens,
        averageTokensPerChunk: Math.round(averageTokens),
    };
}

/**
 * Get overlap text from the end of a chunk
 */
function getOverlapText(text: string, targetTokens: number): string {
    const sentences = splitIntoSentences(text);
    let overlap = '';
    let tokens = 0;

    // Take sentences from the end until we reach target overlap
    for (let i = sentences.length - 1; i >= 0; i--) {
        const sentence = sentences[i];
        const sentenceTokens = countTokens(sentence);

        if (tokens + sentenceTokens > targetTokens) {
            break;
        }

        overlap = sentence + ' ' + overlap;
        tokens += sentenceTokens;
    }

    return overlap.trim();
}

/**
 * Validate chunk quality
 */
export function validateChunks(result: ChunkingResult): {
    isValid: boolean;
    warnings: string[];
} {
    const warnings: string[] = [];

    if (result.totalChunks === 0) {
        return { isValid: false, warnings: ['No chunks generated'] };
    }

    // Check for chunks that are too small
    const tooSmall = result.chunks.filter(c => c.tokenCount < MIN_CHUNK_SIZE);
    if (tooSmall.length > 0) {
        warnings.push(`${tooSmall.length} chunks are below minimum size (${MIN_CHUNK_SIZE} tokens)`);
    }

    // Check for chunks that are too large
    const tooLarge = result.chunks.filter(c => c.tokenCount > CHUNK_SIZE * 1.5);
    if (tooLarge.length > 0) {
        warnings.push(`${tooLarge.length} chunks exceed recommended size`);
    }

    // Check average chunk size
    if (result.averageTokensPerChunk < MIN_CHUNK_SIZE) {
        warnings.push('Average chunk size is too small');
    }

    return {
        isValid: warnings.length === 0,
        warnings,
    };
}
