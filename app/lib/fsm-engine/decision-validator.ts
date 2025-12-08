/**
 * IA 3: Decision Validator
 * 
 * Responsável por validar se a decisão tomada faz sentido no contexto geral
 */

import { OpenAI } from 'openai';
import { ValidationInput, ValidationResult, FSMEngineError } from './types';
import { buildDecisionValidatorPrompt } from './prompts';

/**
 * Valida a decisão tomada pela IA de decisão
 */
export async function validateDecision(
    input: ValidationInput,
    openaiApiKey: string,
    model: string = 'gpt-4o-mini',
    customPrompt?: string | null
): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
        const openai = new OpenAI({ apiKey: openaiApiKey });

        const prompt = buildDecisionValidatorPrompt(input, customPrompt);

        const completion = await openai.chat.completions.create({
            model,
            messages: [
                {
                    role: 'system',
                    content: 'Você é um validador de decisões. Retorne APENAS JSON válido, sem markdown ou texto adicional.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.1, // Baixa temperatura mas não zero para permitir alguma flexibilidade
            response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content;

        if (!responseText) {
            throw new FSMEngineError(
                'VALIDATION_NO_RESPONSE',
                'IA não retornou resposta',
                { input },
                true
            );
        }

        // Parse do JSON retornado
        const parsed = JSON.parse(responseText);

        // Validar estrutura da resposta
        if (
            typeof parsed.approved !== 'boolean' ||
            typeof parsed.confidence !== 'number' ||
            !parsed.justificativa ||
            !Array.isArray(parsed.alertas) ||
            typeof parsed.retryable !== 'boolean'
        ) {
            throw new FSMEngineError(
                'VALIDATION_INVALID_FORMAT',
                'Formato de resposta inválido da IA',
                { response: parsed },
                true
            );
        }

        const result: ValidationResult = {
            approved: parsed.approved,
            confidence: Math.max(0, Math.min(1, parsed.confidence)), // Clamp entre 0 e 1
            justificativa: parsed.justificativa,
            alertas: parsed.alertas,
            retryable: parsed.retryable,
            suggestedState: parsed.suggestedState,
        };

        console.log(`[Decision Validator] Completed in ${Date.now() - startTime}ms`, {
            approved: result.approved,
            confidence: result.confidence,
            alertasCount: result.alertas.length,
            retryable: result.retryable,
        });

        return result;
    } catch (error) {
        console.error('[Decision Validator] Error:', error);

        if (error instanceof FSMEngineError) {
            throw error;
        }

        // Em caso de erro, aprovar por padrão mas com confiança baixa
        return {
            approved: true,
            confidence: 0.3,
            justificativa: `Erro ao validar decisão: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Aprovando por padrão com baixa confiança.`,
            alertas: ['Erro no validador - validação comprometida'],
            retryable: false,
        };
    }
}

/**
 * Detecta loops infinitos no histórico de estados
 */
export function detectStateLoop(
    currentState: string,
    proposedNextState: string,
    conversationHistory: Array<{ role: string; content: string }>
): {
    hasLoop: boolean;
    loopCount: number;
    description: string;
} {
    // Contar quantas vezes o estado atual aparece consecutivamente
    // (simplificado - em produção, analisar o histórico de estados do Lead)

    if (currentState === proposedNextState) {
        return {
            hasLoop: true,
            loopCount: 1,
            description: `Permanecendo no mesmo estado: ${currentState}`,
        };
    }

    return {
        hasLoop: false,
        loopCount: 0,
        description: 'Nenhum loop detectado',
    };
}

/**
 * Verifica se a transição de estado é válida
 */
export function isValidTransition(
    currentState: string,
    nextState: string,
    availableRoutes: {
        rota_de_sucesso: Array<{ estado: string }>;
        rota_de_persistencia: Array<{ estado: string }>;
        rota_de_escape: Array<{ estado: string }>;
    }
): boolean {
    // Verificar se o próximo estado existe em alguma rota
    const allStates = [
        ...availableRoutes.rota_de_sucesso.map(r => r.estado),
        ...availableRoutes.rota_de_persistencia.map(r => r.estado),
        ...availableRoutes.rota_de_escape.map(r => r.estado),
    ];

    return allStates.includes(nextState) || nextState === 'ERRO';
}
