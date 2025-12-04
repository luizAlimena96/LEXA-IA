/**
 * IA 1: Data Extractor
 * 
 * Responsável por extrair dados estruturados da mensagem do usuário
 */

import { OpenAI } from 'openai';
import { ExtractionInput, ExtractionResult, FSMEngineError } from './types';
import { buildDataExtractorPrompt } from './prompts';

/**
 * Extrai dados da mensagem do usuário usando IA
 */
export async function extractDataFromMessage(
    input: ExtractionInput,
    openaiApiKey: string,
    model: string = 'gpt-4o-mini'
): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
        // Se não há dataKey ou é "vazio", não precisa extrair
        if (!input.dataKey || input.dataKey === 'vazio') {
            return {
                success: true,
                data: {},
                confidence: 1.0,
                metadata: {
                    extractedAt: new Date(),
                    dataKey: input.dataKey,
                    dataType: input.dataType,
                    extractedFields: [],
                },
                reasoning: ['Nenhum dado específico para extrair neste estado.'],
            };
        }

        const openai = new OpenAI({ apiKey: openaiApiKey });

        const prompt = buildDataExtractorPrompt(input);

        const completion = await openai.chat.completions.create({
            model,
            messages: [
                {
                    role: 'system',
                    content: 'Você é um extrator de dados especializado. Retorne APENAS JSON válido, sem markdown ou texto adicional.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.1, // Baixa temperatura para respostas mais determinísticas
            response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content;

        if (!responseText) {
            throw new FSMEngineError(
                'EXTRACTION_NO_RESPONSE',
                'IA não retornou resposta',
                { input },
                true
            );
        }

        // Parse do JSON retornado
        const parsed = JSON.parse(responseText);

        // Validar estrutura da resposta
        if (!parsed.data || !parsed.confidence || !parsed.reasoning) {
            throw new FSMEngineError(
                'EXTRACTION_INVALID_FORMAT',
                'Formato de resposta inválido da IA',
                { response: parsed },
                true
            );
        }

        // Merge com dados já coletados
        const mergedData = {
            ...input.currentExtractedData,
            ...parsed.data,
        };

        const result: ExtractionResult = {
            success: true,
            data: mergedData,
            confidence: parsed.confidence,
            metadata: {
                extractedAt: new Date(),
                dataKey: input.dataKey,
                dataType: input.dataType,
                extractedFields: Object.keys(parsed.data),
            },
            reasoning: parsed.reasoning,
        };

        console.log(`[Data Extractor] Completed in ${Date.now() - startTime}ms`, {
            dataKey: input.dataKey,
            confidence: result.confidence,
            extractedFields: result.metadata.extractedFields,
        });

        return result;
    } catch (error) {
        console.error('[Data Extractor] Error:', error);

        if (error instanceof FSMEngineError) {
            throw error;
        }

        // Erro de parsing JSON ou outro erro
        return {
            success: false,
            data: input.currentExtractedData, // Mantém dados anteriores
            confidence: 0.0,
            metadata: {
                extractedAt: new Date(),
                dataKey: input.dataKey,
                dataType: input.dataType,
                extractedFields: [],
            },
            reasoning: [
                'Erro ao extrair dados da mensagem.',
                error instanceof Error ? error.message : 'Erro desconhecido',
            ],
        };
    }
}

/**
 * Valida se o tipo de dado extraído está correto
 */
export function validateDataType(value: any, expectedType: string | null): boolean {
    if (!expectedType) return true;

    switch (expectedType.toLowerCase()) {
        case 'string':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number';
        case 'boolean':
            return typeof value === 'boolean';
        case 'array':
            return Array.isArray(value);
        case 'object':
            return typeof value === 'object' && !Array.isArray(value);
        default:
            return true; // Tipo desconhecido, aceita qualquer coisa
    }
}
