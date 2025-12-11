/**
 * Media Analysis Service
 * 
 * Dedicated AI for analyzing images and documents.
 * This service is called BEFORE the FSM Engine for image/document/video content.
 * Text and audio messages skip this service entirely.
 */

import OpenAI from 'openai';

export interface MediaAnalysisResult {
    success: boolean;
    content: string;
    mediaType: 'image' | 'document' | 'video';
    error?: string;
}

/**
 * Analisa imagem usando GPT-4 Vision
 * Based on n8n workflow: puxa base64 img -> converte -> analisa imagem
 */
export async function analyzeImage(
    base64: string,
    apiKey: string,
    customPrompt?: string
): Promise<MediaAnalysisResult> {
    try {
        const openai = new OpenAI({ apiKey });

        console.log('[Media Analysis] Analyzing image with GPT-4 Vision...');

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: customPrompt || 'Analise, entenda e descreva detalhadamente esta imagem:'
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/jpeg;base64,${base64}`
                        }
                    }
                ]
            }],
            max_tokens: 500
        });

        const content = response.choices[0].message.content || 'Não foi possível analisar a imagem.';

        console.log('[Media Analysis] Image analyzed successfully, content length:', content.length);

        return {
            success: true,
            content,
            mediaType: 'image'
        };
    } catch (error: any) {
        console.error('[Media Analysis] Error analyzing image:', error);
        return {
            success: false,
            content: '',
            mediaType: 'image',
            error: error.message
        };
    }
}

/**
 * Analisa documento PDF usando OpenAI Files API
 * Based on n8n workflow: puxa base doc -> move doc binario -> upload doc -> analisa doc
 * 
 * IMPORTANT: Only PDF is supported. Other formats will return UNSUPPORTED_FORMAT error.
 */
export async function analyzeDocument(
    base64: string,
    fileName: string,
    mimeType: string,
    apiKey: string
): Promise<MediaAnalysisResult> {
    try {
        // Validate file type - ONLY PDF
        if (mimeType !== 'application/pdf') {
            console.log('[Media Analysis] Unsupported document format:', mimeType);
            return {
                success: false,
                content: '',
                mediaType: 'document',
                error: 'UNSUPPORTED_FORMAT'
            };
        }

        console.log('[Media Analysis] Analyzing PDF document:', fileName);

        // Convert base64 to Buffer
        const buffer = Buffer.from(base64, 'base64');

        // Create a Blob/File for upload
        const file = new Blob([buffer], { type: mimeType });

        // 1. Upload file to OpenAI Files API
        const formData = new FormData();
        formData.append('purpose', 'assistants');
        formData.append('file', file, fileName);

        const uploadResponse = await fetch('https://api.openai.com/v1/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
            body: formData,
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`File upload failed: ${uploadResponse.status} - ${errorText}`);
        }

        const uploadData = await uploadResponse.json();
        const fileId = uploadData.id;

        console.log('[Media Analysis] PDF uploaded to OpenAI, file_id:', fileId);

        // 2. Analyze document with GPT using file_id
        const analysisResponse = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4.1-mini',
                input: [{
                    role: 'user',
                    content: [
                        {
                            type: 'input_text',
                            text: 'Extraia todo o conteúdo do documento anexado.'
                        },
                        {
                            type: 'input_file',
                            file_id: fileId
                        }
                    ]
                }]
            }),
        });

        if (!analysisResponse.ok) {
            const errorText = await analysisResponse.text();
            throw new Error(`Document analysis failed: ${analysisResponse.status} - ${errorText}`);
        }

        const analysisData = await analysisResponse.json();
        const extractedContent = analysisData.output?.[0]?.content?.[0]?.text || '';

        console.log('[Media Analysis] PDF content extracted, length:', extractedContent.length);

        // 3. Clean up file after use
        await fetch(`https://api.openai.com/v1/files/${fileId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${apiKey}` },
        }).catch((err) => {
            console.warn('[Media Analysis] Failed to delete file from OpenAI:', err.message);
        });

        return {
            success: true,
            content: extractedContent.substring(0, 3000), // Limit content size
            mediaType: 'document'
        };
    } catch (error: any) {
        console.error('[Media Analysis] Error analyzing document:', error);
        return {
            success: false,
            content: '',
            mediaType: 'document',
            error: error.message
        };
    }
}

/**
 * Registra recebimento de vídeo (sem análise de conteúdo)
 * Video analysis is complex and resource-intensive, so we just register receipt.
 */
export function processVideo(fileName?: string): MediaAnalysisResult {
    console.log('[Media Analysis] Video received:', fileName || 'unnamed');
    return {
        success: true,
        content: `Vídeo recebido${fileName ? `: ${fileName}` : ''}`,
        mediaType: 'video'
    };
}

/**
 * Mensagem padrão para formatos não suportados
 */
export function getUnsupportedFormatMessage(): string {
    return 'Desculpe, não consigo visualizar esse tipo de arquivo. Por favor, envie o documento em formato PDF.';
}

/**
 * Verifica se o tipo de mídia deve usar a IA de análise
 * Returns true for image, PDF, and video.
 * Returns false for text and audio (which use existing flows).
 */
export function shouldUseMediaAnalysis(mediaType: string): boolean {
    return (
        mediaType.startsWith('image/') ||
        mediaType === 'application/pdf' ||
        mediaType.startsWith('video/')
    );
}

/**
 * Verifica se é um formato de documento não suportado
 */
export function isUnsupportedDocumentFormat(mimeType: string): boolean {
    const unsupportedFormats = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    return unsupportedFormats.includes(mimeType) ||
        (mimeType.includes('document') && mimeType !== 'application/pdf');
}
