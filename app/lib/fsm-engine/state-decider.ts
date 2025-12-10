/**
 * IA 2: State Decider
 * 
 * Responsável por executar o motor de decisão hierárquico e decidir o próximo estado
 */

import { OpenAI } from 'openai';
import { DecisionInputForAI, DecisionResult, FSMEngineError, Veredito, TipoRota } from './types';
import { buildStateDeciderPrompt } from './prompts';

/**
 * Decide o próximo estado baseado no motor de decisão hierárquico
 */
export async function decideStateTransition(
    input: DecisionInputForAI,
    openaiApiKey: string,
    model: string = 'gpt-4o-mini',
    customPrompt?: string | null
): Promise<DecisionResult> {
    const startTime = Date.now();

    try {
        const openai = new OpenAI({ apiKey: openaiApiKey });

        const prompt = buildStateDeciderPrompt(input, customPrompt);

        const completion = await openai.chat.completions.create({
            model,
            messages: [
                {
                    role: 'system',
                    content: 'Você é um autômato de execução lógica. Retorne APENAS JSON válido conforme as instruções, sem markdown ou texto adicional.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.0, // Zero temperatura para máxima determinismo
            response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content;

        if (!responseText) {
            throw new FSMEngineError(
                'DECISION_NO_RESPONSE',
                'IA não retornou resposta',
                { input },
                true
            );
        }

        // Parse do JSON retornado
        let parsed;
        try {
            parsed = JSON.parse(responseText);
        } catch (parseError) {
            console.error('[State Decider] JSON parse error:', parseError);
            console.error('[State Decider] Malformed JSON:', responseText.substring(0, 500));
            throw new FSMEngineError(
                'DECISION_INVALID_JSON',
                'JSON mal formatado retornado pela IA',
                { responseText: responseText.substring(0, 200), error: parseError },
                true
            );
        }

        // DEBUG: Log the actual response to see what AI is returning
        console.log('[State Decider] AI Response:', JSON.stringify(parsed, null, 2));

        // Validar estrutura da resposta conforme LEI UM
        if (
            !parsed.pensamento ||
            !Array.isArray(parsed.pensamento) ||
            !parsed.estado_escolhido ||
            !parsed.veredito ||
            !parsed.rota_escolhida
        ) {
            console.error('[State Decider] Invalid format. Missing fields:', {
                hasPensamento: !!parsed.pensamento,
                isPensamentoArray: Array.isArray(parsed.pensamento),
                hasEstadoEscolhido: !!parsed.estado_escolhido,
                hasVeredito: !!parsed.veredito,
                hasRotaEscolhida: !!parsed.rota_escolhida,
                actualResponse: parsed
            });
            throw new FSMEngineError(
                'DECISION_INVALID_FORMAT',
                'Formato de resposta inválido da IA (não segue LEI UM)',
                { response: parsed },
                true
            );
        }

        // Validar se o estado escolhido existe nas rotas disponíveis
        const allStates = [
            ...input.availableRoutes.rota_de_sucesso.map(r => r.estado),
            ...input.availableRoutes.rota_de_persistencia.map(r => r.estado),
            ...input.availableRoutes.rota_de_escape.map(r => r.estado),
        ];

        if (!allStates.includes(parsed.estado_escolhido) && parsed.estado_escolhido !== 'ERRO') {
            console.warn('[State Decider] Estado escolhido não existe nas rotas disponíveis:', {
                estadoEscolhido: parsed.estado_escolhido,
                estadosDisponiveis: allStates,
            });
        }

        // Validar veredito
        const vereditosValidos: Veredito[] = ['SUCESSO', 'FALHA', 'PENDENTE', 'ERRO'];
        if (!vereditosValidos.includes(parsed.veredito as Veredito)) {
            parsed.veredito = 'PENDENTE';
        }

        // Validar rota escolhida
        const rotasValidas: TipoRota[] = ['rota_de_sucesso', 'rota_de_persistencia', 'rota_de_escape'];
        if (!rotasValidas.includes(parsed.rota_escolhida as TipoRota)) {
            parsed.rota_escolhida = 'rota_de_persistencia';
        }

        const result: DecisionResult = {
            pensamento: parsed.pensamento,
            estado_escolhido: parsed.estado_escolhido,
            veredito: parsed.veredito as Veredito,
            rota_escolhida: parsed.rota_escolhida as TipoRota,
            confianca: parsed.confianca || 0.8,
        };

        console.log(`[State Decider] Completed in ${Date.now() - startTime}ms`, {
            currentState: input.currentState,
            nextState: result.estado_escolhido,
            veredito: result.veredito,
            rota: result.rota_escolhida,
            confianca: result.confianca,
        });

        return result;
    } catch (error) {
        console.error('[State Decider] Error:', error);

        if (error instanceof FSMEngineError) {
            throw error;
        }

        // Erro crítico - retornar decisão de erro
        return {
            pensamento: [
                'Erro crítico no motor de decisão.',
                error instanceof Error ? error.message : 'Erro desconhecido',
                'Mantendo estado atual por segurança.',
            ],
            estado_escolhido: input.currentState, // Mantém estado atual
            veredito: 'ERRO',
            rota_escolhida: 'rota_de_persistencia',
            confianca: 0.0,
        };
    }
}

/**
 * Valida se a decisão seguiu as regras do motor hierárquico
 */
export function validateDecisionRules(decision: DecisionResult, input: DecisionInputForAI): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Regra 1: Se veredito é SUCESSO, deve escolher rota_de_sucesso
    if (decision.veredito === 'SUCESSO' && decision.rota_escolhida !== 'rota_de_sucesso') {
        errors.push('Veredito SUCESSO deve escolher rota_de_sucesso');
    }

    // Regra 2: Se veredito é FALHA, NÃO pode escolher rota_de_sucesso
    if (decision.veredito === 'FALHA' && decision.rota_escolhida === 'rota_de_sucesso') {
        errors.push('Veredito FALHA não pode escolher rota_de_sucesso');
    }

    // Regra 3: Estado escolhido deve existir na rota escolhida
    const rotaEscolhida = input.availableRoutes[decision.rota_escolhida];
    const estadoExiste = rotaEscolhida.some(r => r.estado === decision.estado_escolhido);

    if (!estadoExiste && decision.estado_escolhido !== 'ERRO') {
        errors.push(`Estado ${decision.estado_escolhido} não existe na ${decision.rota_escolhida}`);
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Verifica se um estado deve ser pulado porque seu dataKey já foi coletado
 */
export function shouldSkipState(
    stateName: string,
    stateDataKey: string | null,
    extractedData: Record<string, any>
): boolean {
    // Se o estado não tem dataKey, não pode ser pulado
    if (!stateDataKey || stateDataKey === 'vazio') {
        return false;
    }

    // Se o dataKey já existe em extractedData com valor válido, pular
    const value = extractedData[stateDataKey];

    // Verificar se o valor existe e não é null/undefined/empty
    if (value === null || value === undefined || value === '') {
        return false;
    }

    // Se chegou aqui, o dado foi coletado e o estado pode ser pulado
    console.log(`[State Decider] Estado '${stateName}' será pulado - dataKey '${stateDataKey}' já coletado:`, value);
    return true;
}

/**
 * Encontra o próximo estado que ainda precisa de dados
 * Pula estados cujos dataKeys já foram coletados
 */
export async function findNextStateWithMissingData(
    proposedState: string,
    allStates: Array<{ name: string; dataKey: string | null; availableRoutes: any }>,
    extractedData: Record<string, any>,
    maxDepth: number = 10
): Promise<{ nextState: string; skippedStates: string[] }> {
    const skippedStates: string[] = [];
    let currentState = proposedState;
    let depth = 0;

    while (depth < maxDepth) {
        // Encontrar informações do estado atual
        const stateInfo = allStates.find(s => s.name === currentState);

        if (!stateInfo) {
            // Estado não encontrado, retornar como está
            break;
        }

        // Verificar se este estado deve ser pulado
        if (shouldSkipState(currentState, stateInfo.dataKey, extractedData)) {
            skippedStates.push(currentState);

            // Tentar encontrar próximo estado na rota de sucesso
            const routes = stateInfo.availableRoutes as any;
            const successRoute = routes?.rota_de_sucesso;

            if (successRoute && successRoute.length > 0) {
                // Ir para o primeiro estado da rota de sucesso
                currentState = successRoute[0].estado;
                depth++;
            } else {
                // Sem rota de sucesso, não pode pular
                break;
            }
        } else {
            // Estado não deve ser pulado, este é o próximo estado válido
            break;
        }
    }

    if (skippedStates.length > 0) {
        console.log(`[State Decider] Pulados ${skippedStates.length} estados:`, skippedStates);
        console.log(`[State Decider] Próximo estado válido: ${currentState}`);
    }

    return {
        nextState: currentState,
        skippedStates,
    };
}
