/**
 * FSM Decision Engine
 * 
 * Motor de decisão para máquina de estados finitos (FSM)
 * Orquestra 3 IAs sequenciais para decisões precisas
 */

import { prisma } from '@/app/lib/prisma';
import { extractDataFromMessage } from './fsm-engine/data-extractor';
import { decideStateTransition, validateDecisionRules } from './fsm-engine/state-decider';
import { validateDecision, detectStateLoop, isValidTransition } from './fsm-engine/decision-validator';
import {
    DecisionInput,
    DecisionOutput,
    StateInfo,
    AvailableRoutes,
    FSMEngineError,
    ExtractionInput,
    DecisionInputForAI,
    ValidationInput,
} from './fsm-engine/types';

const MAX_RETRIES = 2;

/**
 * Motor de Decisão Principal
 * 
 * Orquestra as 3 IAs em sequência:
 * 1. Data Extractor - Extrai dados da mensagem
 * 2. State Decider - Decide o próximo estado
 * 3. Decision Validator - Valida a decisão
 */
export async function decideNextState(input: DecisionInput): Promise<DecisionOutput> {
    const startTime = Date.now();
    const metrics = {
        extractionTime: 0,
        decisionTime: 0,
        validationTime: 0,
        totalTime: 0,
    };

    try {
        console.log('[FSM Engine] Starting decision process', {
            agentId: input.agentId,
            currentState: input.currentState,
            lastMessage: input.lastMessage.substring(0, 100),
        });

        // Buscar configuração do agente
        const agent = await prisma.agent.findUnique({
            where: { id: input.agentId },
            select: {
                id: true,
                organizationId: true,
                organization: {
                    select: {
                        openaiApiKey: true,
                        openaiModel: true,
                    },
                },
            },
        });

        if (!agent || !agent.organization.openaiApiKey) {
            throw new FSMEngineError(
                'AGENT_NOT_FOUND',
                'Agente não encontrado ou sem chave OpenAI configurada',
                { agentId: input.agentId },
                false
            );
        }

        const openaiApiKey = agent.organization.openaiApiKey;
        const openaiModel = agent.organization.openaiModel || 'gpt-4o-mini';

        // Buscar estado atual
        const state = await prisma.state.findFirst({
            where: {
                agentId: input.agentId,
                name: input.currentState,
            },
        });

        if (!state) {
            console.warn(`[FSM Engine] State '${input.currentState}' not found, using INICIO`);

            // Tentar buscar estado INICIO
            const inicioState = await prisma.state.findFirst({
                where: {
                    agentId: input.agentId,
                    name: 'INICIO',
                },
            });

            if (!inicioState) {
                throw new FSMEngineError(
                    'STATE_NOT_FOUND',
                    `Estado '${input.currentState}' não encontrado e estado INICIO não existe`,
                    { currentState: input.currentState },
                    false
                );
            }

            return await processState(inicioState, input, openaiApiKey, openaiModel, metrics, startTime);
        }

        return await processState(state, input, openaiApiKey, openaiModel, metrics, startTime);
    } catch (error) {
        console.error('[FSM Engine] Fatal error:', error);

        metrics.totalTime = Date.now() - startTime;

        // Retornar estado atual em caso de erro
        return {
            nextState: input.currentState,
            reasoning: [
                'Erro fatal no motor de decisão.',
                error instanceof Error ? error.message : 'Erro desconhecido',
                'Mantendo estado atual por segurança.',
            ],
            extractedData: input.extractedData,
            validation: {
                approved: false,
                confidence: 0.0,
                justificativa: 'Erro fatal no processamento',
                alertas: ['Erro crítico no motor FSM'],
                retryable: error instanceof FSMEngineError ? error.recoverable : false,
            },
            shouldExtractData: false,
            metrics,
        };
    }
}

/**
 * Processa um estado específico com as 3 IAs
 */
async function processState(
    state: any,
    input: DecisionInput,
    openaiApiKey: string,
    openaiModel: string,
    metrics: any,
    startTime: number
): Promise<DecisionOutput> {
    const routes = state.availableRoutes as unknown as AvailableRoutes;
    const stateInfo: StateInfo = {
        id: state.id,
        name: state.name,
        missionPrompt: state.missionPrompt,
        availableRoutes: routes,
        dataKey: state.dataKey,
        dataDescription: state.dataDescription,
        dataType: state.dataType,
        prohibitions: state.prohibitions,
        tools: state.tools,
    };

    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= MAX_RETRIES) {
        try {
            // ==================== IA 1: DATA EXTRACTOR ====================
            const extractionStart = Date.now();

            const extractionInput: ExtractionInput = {
                message: input.lastMessage,
                dataKey: state.dataKey,
                dataType: state.dataType,
                dataDescription: state.dataDescription,
                currentExtractedData: input.extractedData,
                conversationHistory: input.conversationHistory,
            };

            const extractionResult = await extractDataFromMessage(
                extractionInput,
                openaiApiKey,
                openaiModel
            );

            metrics.extractionTime = Date.now() - extractionStart;

            console.log('[FSM Engine] IA 1 (Data Extractor) completed', {
                success: extractionResult.success,
                confidence: extractionResult.confidence,
                extractedFields: extractionResult.metadata.extractedFields,
            });

            // ==================== IA 2: STATE DECIDER ====================
            const decisionStart = Date.now();

            const decisionInput: DecisionInputForAI = {
                currentState: state.name,
                missionPrompt: state.missionPrompt,
                dataKey: state.dataKey,
                extractedData: extractionResult.data,
                lastMessage: input.lastMessage,
                conversationHistory: input.conversationHistory,
                availableRoutes: routes,
                prohibitions: state.prohibitions,
            };

            const decisionResult = await decideStateTransition(
                decisionInput,
                openaiApiKey,
                openaiModel
            );

            metrics.decisionTime = Date.now() - decisionStart;

            console.log('[FSM Engine] IA 2 (State Decider) completed', {
                nextState: decisionResult.estado_escolhido,
                veredito: decisionResult.veredito,
                rota: decisionResult.rota_escolhida,
                confianca: decisionResult.confianca,
            });

            // Validar regras do motor de decisão
            const rulesValidation = validateDecisionRules(decisionResult, decisionInput);
            if (!rulesValidation.valid) {
                console.warn('[FSM Engine] Decision rules violated:', rulesValidation.errors);
                decisionResult.pensamento.push(
                    '⚠️ AVISO: Regras do motor violadas:',
                    ...rulesValidation.errors
                );
            }

            // ==================== IA 3: DECISION VALIDATOR ====================
            const validationStart = Date.now();

            const validationInput: ValidationInput = {
                currentState: state.name,
                proposedNextState: decisionResult.estado_escolhido,
                decision: decisionResult,
                extractedData: extractionResult.data,
                conversationHistory: input.conversationHistory,
                stateInfo,
            };

            const validationResult = await validateDecision(
                validationInput,
                openaiApiKey,
                openaiModel
            );

            metrics.validationTime = Date.now() - validationStart;

            console.log('[FSM Engine] IA 3 (Decision Validator) completed', {
                approved: validationResult.approved,
                confidence: validationResult.confidence,
                alertasCount: validationResult.alertas.length,
            });

            // Detectar loops
            const loopDetection = detectStateLoop(
                state.name,
                decisionResult.estado_escolhido,
                input.conversationHistory
            );

            if (loopDetection.hasLoop) {
                validationResult.alertas.push(loopDetection.description);
            }

            // Validar transição
            const isValid = isValidTransition(
                state.name,
                decisionResult.estado_escolhido,
                routes
            );

            if (!isValid) {
                validationResult.alertas.push(
                    `Transição inválida: ${state.name} → ${decisionResult.estado_escolhido}`
                );
            }

            // ==================== RETRY LOGIC ====================
            if (!validationResult.approved && validationResult.retryable && retryCount < MAX_RETRIES) {
                retryCount++;
                console.warn(`[FSM Engine] Validation failed, retrying (${retryCount}/${MAX_RETRIES})`, {
                    justificativa: validationResult.justificativa,
                });
                lastError = new Error(validationResult.justificativa);
                continue; // Retry
            }

            // ==================== RESULTADO FINAL ====================
            metrics.totalTime = Date.now() - startTime;

            const output: DecisionOutput = {
                nextState: validationResult.approved
                    ? decisionResult.estado_escolhido
                    : validationResult.suggestedState || state.name,
                reasoning: [
                    ...extractionResult.reasoning,
                    '---',
                    ...decisionResult.pensamento,
                    '---',
                    `Validação: ${validationResult.approved ? 'APROVADA' : 'REJEITADA'}`,
                    validationResult.justificativa,
                    ...validationResult.alertas.map(a => `⚠️ ${a}`),
                ],
                extractedData: extractionResult.data,
                validation: validationResult,
                shouldExtractData: extractionResult.success && extractionResult.metadata.extractedFields.length > 0,
                dataToExtract: state.dataKey,
                metrics,
            };

            console.log('[FSM Engine] Decision process completed', {
                totalTime: metrics.totalTime,
                nextState: output.nextState,
                approved: validationResult.approved,
            });

            return output;
        } catch (error) {
            lastError = error as Error;
            console.error(`[FSM Engine] Error in attempt ${retryCount + 1}:`, error);

            if (retryCount < MAX_RETRIES) {
                retryCount++;
                continue; // Retry
            }

            // Máximo de retries atingido
            break;
        }
    }

    // Se chegou aqui, todas as tentativas falharam
    metrics.totalTime = Date.now() - startTime;

    return {
        nextState: state.name, // Mantém estado atual
        reasoning: [
            `Erro após ${MAX_RETRIES + 1} tentativas.`,
            lastError?.message || 'Erro desconhecido',
            'Mantendo estado atual por segurança.',
        ],
        extractedData: input.extractedData,
        validation: {
            approved: false,
            confidence: 0.0,
            justificativa: `Falha após ${MAX_RETRIES + 1} tentativas`,
            alertas: ['Erro crítico - máximo de retries atingido'],
            retryable: false,
        },
        shouldExtractData: false,
        metrics,
    };
}
