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
    model: string = 'gpt-4o-mini',
    customPrompt?: string | null
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

        const prompt = buildDataExtractorPrompt(input, customPrompt);

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

/**
 * GLOBAL DATA EXTRACTION
 * Extrai múltiplos dados de uma única mensagem
 */
export async function extractAllDataFromMessage(
    input: import('./types').GlobalExtractionInput,
    openaiApiKey: string,
    model: string = 'gpt-4o-mini'
): Promise<import('./types').GlobalExtractionResult> {
    const startTime = Date.now();

    try {
        // Se não há dataKeys para extrair
        if (!input.allDataKeys || input.allDataKeys.length === 0) {
            return {
                success: true,
                extractedData: {},
                confidence: {},
                metadata: {
                    extractedAt: new Date(),
                    totalDataKeys: 0,
                    extractedCount: 0,
                    extractedFields: [],
                },
                reasoning: ['Nenhum dataKey disponível para extração.'],
            };
        }

        const openai = new OpenAI({ apiKey: openaiApiKey });

        // Build prompt for global extraction
        const dataKeysDescription = input.allDataKeys
            .map(dk => `- **${dk.key}**: ${dk.description} (tipo: ${dk.type})`)
            .join('\n');

        const prompt = `Você é um extrator de dados especializado. Analise a mensagem e extraia TODOS os dados possíveis.

DADOS DISPONÍVEIS PARA EXTRAÇÃO:
${dataKeysDescription}

DADOS JÁ COLETADOS:
${JSON.stringify(input.currentExtractedData, null, 2)}

MENSAGEM DO USUÁRIO:
"${input.message}"

REGRAS:
1. Tente extrair TODOS os dados que encontrar na mensagem
2. Se um dado não estiver presente, não o inclua no resultado
3. Normalize os valores conforme o tipo esperado:
   - string: texto limpo
   - number: apenas números (ex: "60 mil" → 60000)
   - boolean: true/false
4. Retorne apenas os dados que você tem ALTA confiança (>0.7)
5. NÃO extraia dados que já existem em DADOS JÁ COLETADOS com valores válidos

FORMATO DE SAÍDA (JSON):
{
  "extractedData": {
    "nome_cliente": "João",
    "valor_divida": 60000
  },
  "confidence": {
    "nome_cliente": 1.0,
    "valor_divida": 0.9
  },
  "reasoning": [
    "Cliente mencionou nome: João",
    "Cliente mencionou valor: 60 mil → convertido para 60000"
  ]
}`;

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
            temperature: 0.1,
            response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(responseText);

        const extractedData = parsed.extractedData || {};
        const confidence = parsed.confidence || {};
        const reasoning = parsed.reasoning || [];

        // Filter out low confidence extractions
        const filteredData: Record<string, any> = {};
        const filteredConfidence: Record<string, number> = {};

        for (const [key, value] of Object.entries(extractedData)) {
            const conf = confidence[key] || 0;
            if (conf >= 0.7) {
                filteredData[key] = value;
                filteredConfidence[key] = conf;
            }
        }

        return {
            success: true,
            extractedData: filteredData,
            confidence: filteredConfidence,
            metadata: {
                extractedAt: new Date(),
                totalDataKeys: input.allDataKeys.length,
                extractedCount: Object.keys(filteredData).length,
                extractedFields: Object.keys(filteredData),
            },
            reasoning,
        };
    } catch (error: any) {
        console.error('[Global Data Extractor] Error:', error);
        return {
            success: false,
            extractedData: {},
            confidence: {},
            metadata: {
                extractedAt: new Date(),
                totalDataKeys: input.allDataKeys.length,
                extractedCount: 0,
                extractedFields: [],
            },
            reasoning: [`Erro na extração: ${error.message}`],
        };
    }
}
