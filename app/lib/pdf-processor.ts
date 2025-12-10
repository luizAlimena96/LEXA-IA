/**
 * PDF Processor Service
 * Extracts and processes text from PDF files
 */

import { chunkText, ChunkingResult } from './chunking-service';

export interface PDFProcessingResult {
    success: boolean;
    text?: string;
    cleanText?: string;
    chunks?: ChunkingResult;
    metadata?: {
        pages: number;
        title?: string;
        author?: string;
        createdAt?: Date;
    };
    error?: string;
}

/**
 * Clean and normalize extracted text
 */
function cleanText(text: string): string {
    return text
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Remove spaces between individual characters (fix encoding issues)
        .replace(/(\w)\s+(?=\w)/g, '$1')
        // Normalize line breaks
        .replace(/\r\n/g, '\n')
        // Remove excessive line breaks (more than 2)
        .replace(/\n{3,}/g, '\n\n')
        // Remove leading/trailing whitespace
        .trim()
        // Fix common PDF extraction issues
        .replace(/\u00A0/g, ' ') // Non-breaking space
        .replace(/\u2022/g, '•') // Bullet point
        .replace(/\u2013/g, '-') // En dash
        .replace(/\u2014/g, '—') // Em dash
        .replace(/\u2018/g, "'") // Left single quote
        .replace(/\u2019/g, "'") // Right single quote
        .replace(/\u201C/g, '"') // Left double quote
        .replace(/\u201D/g, '"'); // Right double quote
}

/**
 * Process PDF buffer and extract text
 */
export async function processPDF(buffer: Buffer): Promise<PDFProcessingResult> {
    // Delegate to CommonJS version which handles pdf-parse correctly
    const processor = require('./pdf-processor.cjs');
    return processor.processPDF(buffer);
}

/**
 * Process PDF from file path
 */
export async function processPDFFromFile(filePath: string): Promise<PDFProcessingResult> {
    const processor = require('./pdf-processor.cjs');
    return processor.processPDFFromFile(filePath);
}

/**
 * Validate PDF file
 */
export function isPDF(buffer: Buffer): boolean {
    const processor = require('./pdf-processor.cjs');
    return processor.isPDF(buffer);
}
