/**
 * PDF Processor Service (pdfjs-dist with proper worker setup)
 * Extracts and processes text from PDF files using Mozilla's PDF.js
 */

const { encoding_for_model } = require('tiktoken');

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 100;
const MIN_CHUNK_SIZE = 100;

// Lazy-load pdfjs to configure worker
let pdfjsLib = null;

async function getPdfJs() {
    if (!pdfjsLib) {
        // Polyfill DOM globals for Node.js environment
        if (typeof globalThis.DOMMatrix === 'undefined') {
            globalThis.DOMMatrix = class DOMMatrix { };
        }

        pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

        // Configure worker with file:// URL for Windows compatibility
        const path = require('path');
        const url = require('url');
        const workerPath = path.join(require.resolve('pdfjs-dist/package.json'), '../build/pdf.worker.min.mjs');
        pdfjsLib.GlobalWorkerOptions.workerSrc = url.pathToFileURL(workerPath).href;
    }
    return pdfjsLib;
}

/**
 * Count tokens in text using tiktoken
 */
function countTokens(text) {
    try {
        const encoder = encoding_for_model('text-embedding-3-small');
        const tokens = encoder.encode(text);
        const count = tokens.length;
        encoder.free();
        return count;
    } catch (error) {
        return Math.ceil(text.length / 4);
    }
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences.map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Split text into paragraphs
 */
function splitIntoParagraphs(text) {
    return text
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);
}

/**
 * Get overlap text from the end of a chunk
 */
function getOverlapText(text, targetTokens) {
    const sentences = splitIntoSentences(text);
    let overlap = '';
    let tokens = 0;

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
 * Create chunks from text with semantic awareness
 */
function chunkText(text) {
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
    const chunks = [];
    let currentChunk = '';
    let currentTokens = 0;
    let charPosition = 0;

    for (const paragraph of paragraphs) {
        const paragraphTokens = countTokens(paragraph);

        if (paragraphTokens > CHUNK_SIZE) {
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

            const sentences = splitIntoSentences(paragraph);
            let sentenceBuffer = '';
            let sentenceTokens = 0;

            for (const sentence of sentences) {
                const sentenceTokenCount = countTokens(sentence);

                if (sentenceTokens + sentenceTokenCount > CHUNK_SIZE && sentenceBuffer.length > 0) {
                    chunks.push({
                        content: sentenceBuffer.trim(),
                        index: chunks.length,
                        tokenCount: sentenceTokens,
                        startChar: charPosition - sentenceBuffer.length,
                        endChar: charPosition,
                    });

                    const overlapText = getOverlapText(sentenceBuffer, CHUNK_OVERLAP);
                    sentenceBuffer = overlapText + ' ' + sentence;
                    sentenceTokens = countTokens(sentenceBuffer);
                } else {
                    sentenceBuffer += (sentenceBuffer ? ' ' : '') + sentence;
                    sentenceTokens += sentenceTokenCount;
                }

                charPosition += sentence.length + 1;
            }

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
            if (currentTokens + paragraphTokens > CHUNK_SIZE && currentChunk.length > 0) {
                chunks.push({
                    content: currentChunk.trim(),
                    index: chunks.length,
                    tokenCount: currentTokens,
                    startChar: charPosition - currentChunk.length,
                    endChar: charPosition,
                });

                const overlapText = getOverlapText(currentChunk, CHUNK_OVERLAP);
                currentChunk = overlapText + '\n\n' + paragraph;
                currentTokens = countTokens(currentChunk);
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
                currentTokens += paragraphTokens;
            }

            charPosition += paragraph.length + 2;
        }
    }

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
 * Clean and normalize extracted text
 * CRITICAL: Must preserve spaces between WORDS while removing spaces between individual CHARACTERS
 */
function cleanText(text) {
    // Step 1: Normalize line breaks and Unicode characters first
    let cleaned = text
        .replace(/\r\n/g, '\n')
        .replace(/\u00A0/g, ' ')      // Non-breaking space → regular space
        .replace(/\u2022/g, '•')      // Bullet point
        .replace(/\u2013/g, '-')      // En dash
        .replace(/\u2014/g, '—')      // Em dash
        .replace(/\u2018/g, "'")      // Left single quote
        .replace(/\u2019/g, "'")      // Right single quote
        .replace(/\u201C/g, '"')      // Left double quote
        .replace(/\u201D/g, '"');     // Right double quote

    // Step 2: Fix the spacing issue
    // The PDF has spaces between EVERY character: "A K r u g e r T o l e d o"
    // We need to detect this pattern and fix it while preserving normal word spacing

    // Strategy: If we see single characters separated by spaces, join them
    // But preserve spaces that separate actual words (multiple characters)

    // Replace pattern: single char + space + single char → join them
    // This will turn "A K r u g e r" into "AKruger"
    // But "palavra outra" stays as "palavra outra"
    cleaned = cleaned.replace(/\b(\w)\s+(?=\w\b)/g, '$1');

    // Step 3: Collapse multiple spaces into one (but keep at least one space between words)
    cleaned = cleaned.replace(/[ \t]+/g, ' ');

    // Step 4: Normalize excessive line breaks
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    return cleaned.trim();
}

/**
 * Extract text from PDF using pdfjs-dist
 */
async function extractTextFromPDF(buffer) {
    const pdfjs = await getPdfJs();

    const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;

    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Combine text items with proper spacing
        const pageText = textContent.items
            .map(item => item.str)
            .join(' ');

        fullText += pageText + '\n\n';
    }

    return {
        text: fullText,
        numPages: numPages,
        info: await pdfDocument.getMetadata().catch(() => ({ info: {} }))
    };
}

/**
 * Process PDF buffer and extract text
 */
async function processPDF(buffer) {
    try {
        console.log('[PDF Processor] Starting PDF processing...');
        console.log('[PDF Processor] Buffer size:', buffer.length, 'bytes');

        const data = await extractTextFromPDF(buffer);

        console.log('[PDF Processor] PDF parsed successfully');
        console.log('[PDF Processor] Pages:', data.numPages);
        console.log('[PDF Processor] Raw text length:', data.text.length);

        if (!data.text || data.text.trim().length === 0) {
            return {
                success: false,
                error: 'PDF não contém texto extraível',
            };
        }

        const cleaned = cleanText(data.text);
        console.log('[PDF Processor] Cleaned text length:', cleaned.length);
        console.log('[PDF Processor] Text preview (first 200 chars):', cleaned.substring(0, 200));

        const chunkingResult = chunkText(cleaned);
        console.log('[PDF Processor] Chunking completed:', {
            totalChunks: chunkingResult.totalChunks,
            averageTokens: chunkingResult.averageTokensPerChunk,
        });

        return {
            success: true,
            text: data.text,
            cleanText: cleaned,
            chunks: chunkingResult,
            metadata: {
                pages: data.numPages,
                title: data.info?.info?.Title,
                author: data.info?.info?.Author,
                createdAt: data.info?.info?.CreationDate ? new Date(data.info.info.CreationDate) : undefined,
            },
        };
    } catch (error) {
        console.error('[PDF Processor] Error processing PDF:', error);
        return {
            success: false,
            error: error.message || 'Erro ao processar PDF',
        };
    }
}

/**
 * Process PDF from file path
 */
async function processPDFFromFile(filePath) {
    try {
        const fs = require('fs/promises');
        const buffer = await fs.readFile(filePath);
        return processPDF(buffer);
    } catch (error) {
        console.error('[PDF Processor] Error reading file:', error);
        return {
            success: false,
            error: `Erro ao ler arquivo: ${error.message}`,
        };
    }
}

/**
 * Validate PDF file
 */
function isPDF(buffer) {
    const header = buffer.toString('utf-8', 0, 5);
    return header === '%PDF-';
}

module.exports = {
    processPDF,
    processPDFFromFile,
    isPDF
};
