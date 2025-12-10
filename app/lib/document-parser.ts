/**
 * Document Parser
 * Extracts text content from PDF, TXT, and DOC files
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const CHUNK_SIZE = 800; // ~800 characters per chunk - menor para melhor busca semântica
const MAX_CHUNKS = 500; // Permitir mais chunks para documentos grandes

export interface ParseResult {
    success: boolean;
    text: string;
    chunks: string[];
    metadata: {
        fileName: string;
        fileSize: number;
        pageCount?: number;
        chunkCount: number;
    };
    error?: string;
}

/**
 * Splits text into chunks of approximately CHUNK_SIZE characters
 * Tries to break at sentence boundaries when possible
 */
function splitIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    let currentChunk = '';

    // Split by paragraphs first
    const paragraphs = text.split(/\n\n+/);

    for (const paragraph of paragraphs) {
        if ((currentChunk + paragraph).length <= CHUNK_SIZE) {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        } else {
            // Save current chunk if it has content
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }

            // If paragraph itself is larger than CHUNK_SIZE, split by sentences
            if (paragraph.length > CHUNK_SIZE) {
                const sentences = paragraph.split(/(?<=[.!?])\s+/);
                currentChunk = '';

                for (const sentence of sentences) {
                    if ((currentChunk + sentence).length <= CHUNK_SIZE) {
                        currentChunk += (currentChunk ? ' ' : '') + sentence;
                    } else {
                        if (currentChunk) {
                            chunks.push(currentChunk.trim());
                        }
                        // If single sentence is too long, just force split
                        if (sentence.length > CHUNK_SIZE) {
                            for (let i = 0; i < sentence.length; i += CHUNK_SIZE) {
                                chunks.push(sentence.slice(i, i + CHUNK_SIZE).trim());
                            }
                            currentChunk = '';
                        } else {
                            currentChunk = sentence;
                        }
                    }
                }
            } else {
                currentChunk = paragraph;
            }
        }

        // Check if we've hit max chunks
        if (chunks.length >= MAX_CHUNKS) {
            break;
        }
    }

    // Don't forget the last chunk
    if (currentChunk && chunks.length < MAX_CHUNKS) {
        chunks.push(currentChunk.trim());
    }

    return chunks.slice(0, MAX_CHUNKS);
}

/**
 * Parse PDF file and extract text using pdf2json
 */
async function parsePdf(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
    // pdf2json works natively in Node.js without browser APIs
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PDFParser = require('pdf2json');

    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on('pdfParser_dataError', (errData: any) => {
            reject(new Error(errData.parserError || 'PDF parsing failed'));
        });

        pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
            try {
                // Extract text from all pages
                const pages = pdfData.Pages || [];
                const textParts: string[] = [];

                for (const page of pages) {
                    const texts = page.Texts || [];
                    for (const textItem of texts) {
                        const runs = textItem.R || [];
                        for (const run of runs) {
                            if (run.T) {
                                // Decode URI-encoded text with fallback for malformed URIs
                                try {
                                    textParts.push(decodeURIComponent(run.T));
                                } catch {
                                    // If decoding fails, use raw text
                                    textParts.push(run.T.replace(/%[0-9A-Fa-f]{2}/g, ' '));
                                }
                            }
                        }
                    }
                    textParts.push('\n'); // Page break
                }

                resolve({
                    text: textParts.join(' ').replace(/\s+/g, ' ').trim(),
                    pageCount: pages.length,
                });
            } catch (error: any) {
                reject(new Error(`PDF text extraction failed: ${error.message}`));
            }
        });

        // Parse from buffer
        pdfParser.parseBuffer(buffer);
    });
}

/**
 * Parse TXT file
 */
function parseTxt(buffer: Buffer): string {
    return buffer.toString('utf-8');
}

/**
 * Parse DOC/DOCX file (basic extraction)
 * Note: For full DOCX support, consider adding mammoth library
 */
function parseDoc(buffer: Buffer, fileName: string): string {
    // For .docx, try to extract text from the XML content
    if (fileName.endsWith('.docx')) {
        // DOCX is a ZIP containing XML files
        // This is a simplified extraction - for production, use mammoth
        const content = buffer.toString('utf-8');
        // Try to extract text between XML tags
        const textMatches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (textMatches) {
            return textMatches
                .map(m => m.replace(/<[^>]+>/g, ''))
                .join(' ');
        }
    }

    // For .doc (legacy format), just extract readable text
    return buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r]/g, ' ');
}

/**
 * Main function to parse a document
 */
export async function parseDocument(
    buffer: Buffer,
    fileName: string,
    mimeType: string
): Promise<ParseResult> {
    const fileSize = buffer.length;

    // Check file size
    if (fileSize > MAX_FILE_SIZE) {
        return {
            success: false,
            text: '',
            chunks: [],
            metadata: { fileName, fileSize, chunkCount: 0 },
            error: `Arquivo muito grande. Máximo permitido: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        };
    }

    let text = '';
    let pageCount: number | undefined;

    try {
        // Determine file type and parse accordingly
        const extension = fileName.toLowerCase().split('.').pop();

        if (extension === 'pdf' || mimeType === 'application/pdf') {
            const result = await parsePdf(buffer);
            text = result.text;
            pageCount = result.pageCount;
        } else if (extension === 'txt' || mimeType === 'text/plain') {
            text = parseTxt(buffer);
        } else if (extension === 'doc' || extension === 'docx' ||
            mimeType === 'application/msword' ||
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            text = parseDoc(buffer, fileName);
        } else {
            return {
                success: false,
                text: '',
                chunks: [],
                metadata: { fileName, fileSize, chunkCount: 0 },
                error: `Tipo de arquivo não suportado: ${extension}. Use PDF, TXT ou DOC/DOCX.`,
            };
        }

        // Clean up text
        text = text
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        if (!text) {
            return {
                success: false,
                text: '',
                chunks: [],
                metadata: { fileName, fileSize, chunkCount: 0 },
                error: 'Não foi possível extrair texto do documento. O arquivo pode estar vazio ou protegido.',
            };
        }

        // Split into chunks
        const chunks = splitIntoChunks(text);

        return {
            success: true,
            text,
            chunks,
            metadata: {
                fileName,
                fileSize,
                pageCount,
                chunkCount: chunks.length,
            },
        };
    } catch (error: any) {
        console.error('[Document Parser] Error:', error);
        return {
            success: false,
            text: '',
            chunks: [],
            metadata: { fileName, fileSize, chunkCount: 0 },
            error: `Erro ao processar documento: ${error.message}`,
        };
    }
}

/**
 * Validate file type
 */
export function isValidFileType(fileName: string, mimeType: string): boolean {
    const extension = fileName.toLowerCase().split('.').pop();
    const validExtensions = ['pdf', 'txt', 'doc', 'docx'];
    const validMimeTypes = [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    return validExtensions.includes(extension || '') || validMimeTypes.includes(mimeType);
}
