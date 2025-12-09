import { prisma } from '@/app/lib/prisma';
import { extractDataFromMessage } from './fsm-engine/data-extractor';
import { decideStateTransition, validateDecisionRules } from './fsm-engine/state-decider';
import { validateDecision, detectStateLoop, isValidTransition } from './fsm-engine/decision-validator';
import { delay, calculateBackoff } from './timeout-protection';
import {
    DecisionInput,
    DecisionOutput,
    StateInfo,
    AvailableRoutes,
    FSMEngineError,
    ExtractionInput,
    DecisionInputForAI,
    ValidationInput,
    AgentContext,
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
                name: true,
                personality: true,
                tone: true,
                systemPrompt: true,
                instructions: true,
                writingStyle: true,
                prohibitions: true,
                organizationId: true,
                fsmDataExtractorPrompt: true,
                fsmStateDeciderPrompt: true,
                fsmValidatorPrompt: true,
                organization: {
                    select: {
                        openaiApiKey: true,
                        openaiModel: true,
                        workingHours: true,
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

        // Create agent context for prompts
        const agentContext: AgentContext = {
            name: agent.name,
            personality: agent.personality,
            tone: agent.tone,
            systemPrompt: agent.systemPrompt,
            instructions: agent.instructions,
            writingStyle: agent.writingStyle,
            prohibitions: agent.prohibitions,
            workingHours: agent.organization.workingHours,
        };

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

            return await processState(inicioState, input, openaiApiKey, openaiModel, metrics, startTime, agentContext, {
                dataExtractor: input.customPrompts?.dataExtractor || agent.fsmDataExtractorPrompt,
                stateDecider: input.customPrompts?.stateDecider || agent.fsmStateDeciderPrompt,
                validator: input.customPrompts?.validator || agent.fsmValidatorPrompt,
            });
        }

        return await processState(state, input, openaiApiKey, openaiModel, metrics, startTime, agentContext, {
            dataExtractor: input.customPrompts?.dataExtractor || agent.fsmDataExtractorPrompt,
            stateDecider: input.customPrompts?.stateDecider || agent.fsmStateDeciderPrompt,
            validator: input.customPrompts?.validator || agent.fsmValidatorPrompt,
        });
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
    startTime: number,
    agentContext: AgentContext,
    customPrompts?: {
        dataExtractor?: string | null;
        stateDecider?: string | null;
        validator?: string | null;
    }
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
            // ==================== GLOBAL DATA EXTRACTION ====================
            // Extract ALL possible dataKeys from the message
            const globalExtractionStart = Date.now();

            // Get all states for this agent to collect all dataKeys
            const allStates = await prisma.state.findMany({
                where: { agentId: input.agentId },
                select: {
                    dataKey: true,
                    dataDescription: true,
                    dataType: true,
                },
            });

            // Build list of all dataKeys
            const allDataKeys: import('./fsm-engine/types').DataKeyDefinition[] = allStates
                .filter((s: { dataKey: string | null; dataDescription: string | null; dataType: string | null }) => s.dataKey && s.dataKey !== 'vazio')
                .map((s: { dataKey: string | null; dataDescription: string | null; dataType: string | null }) => ({
                    key: s.dataKey!,
                    description: s.dataDescription || '',
                    type: s.dataType || 'string',
                }));

            console.log('[FSM Engine] Global extraction - found', allDataKeys.length, 'dataKeys');

            // Perform global extraction
            const { extractAllDataFromMessage } = await import('./fsm-engine/data-extractor');
            const globalExtractionResult = await extractAllDataFromMessage(
                {
                    message: input.lastMessage,
                    allDataKeys,
                    currentExtractedData: input.extractedData,
                    conversationHistory: input.conversationHistory,
                    agentContext,
                },
                openaiApiKey,
                openaiModel
            );

            console.log('[FSM Engine] Global extraction completed', {
                extractedCount: globalExtractionResult.metadata.extractedCount,
                extractedFields: globalExtractionResult.metadata.extractedFields,
            });

            // Merge global extraction with current extracted data
            let updatedExtractedData = {
                ...input.extractedData,
                ...globalExtractionResult.extractedData,
            };

            // Save extracted data to lead if leadId is provided
            if (input.leadId && Object.keys(globalExtractionResult.extractedData).length > 0) {
                await prisma.lead.update({
                    where: { id: input.leadId },
                    data: {
                        extractedData: updatedExtractedData,
                    },
                });
                console.log('[FSM Engine] Saved', Object.keys(globalExtractionResult.extractedData).length, 'new data fields to lead');
            }

            // Update input with new extracted data
            input.extractedData = updatedExtractedData;

            // ==================== IA 1: DATA EXTRACTOR ====================
            const extractionStart = Date.now();

            const extractionInput: ExtractionInput = {
                message: input.lastMessage,
                dataKey: state.dataKey,
                dataType: state.dataType,
                dataDescription: state.dataDescription,
                currentExtractedData: updatedExtractedData, // Use updated data
                conversationHistory: input.conversationHistory,
                agentContext,
            };

            const extractionResult = await extractDataFromMessage(
                extractionInput,
                openaiApiKey,
                openaiModel,
                customPrompts?.dataExtractor
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
                agentContext,
            };

            const decisionResult = await decideStateTransition(
                decisionInput,
                openaiApiKey,
                openaiModel,
                customPrompts?.stateDecider
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
                agentContext,
            };

            const validationResult = await validateDecision(
                validationInput,
                openaiApiKey,
                openaiModel,
                customPrompts?.validator
            );

            metrics.validationTime = Date.now() - validationStart;

            console.log('[FSM Engine] IA 3 (Decision Validator) completed', {
                approved: validationResult.approved,
                confidence: validationResult.confidence,
                alertasCount: validationResult.alertas.length,
            });

            // Initialize final next state based on validation
            let finalNextState = validationResult.approved ? decisionResult.estado_escolhido : state.name;

            // ==================== TOOL EXECUTION ====================
            // Execute tools if the current state has them configured
            console.log(`[FSM Engine] Checking for tools in state '${state.name}'`, {
                hasTools: !!state.tools,
                toolsValue: state.tools,
                toolsType: typeof state.tools
            });

            if (state.tools && state.tools !== 'null' && state.tools !== '') {
                try {
                    const tools = typeof state.tools === 'string' ? JSON.parse(state.tools) : state.tools;
                    const toolsList = Array.isArray(tools) ? tools : [];

                    if (toolsList.length > 0) {
                        console.log(`[FSM Engine] State '${state.name}' has tools:`, toolsList);

                        const { executeFSMTool } = await import('./fsm-engine/tools-handler');

                        for (const toolName of toolsList) {
                            console.log(`[FSM Engine] Executing tool: ${toolName}`);

                            // Build tool arguments from extracted data
                            const diaHorario = updatedExtractedData.dia_horário || updatedExtractedData.horario_escolhido || '';
                            console.log(`[FSM Engine] dia_horário value:`, diaHorario);

                            // Parse date and time from dia_horário
                            // Expected formats: "amanhã às 10h", "terça-feira 14:00", "segunda-feira às 09h"
                            let date = '';
                            let time = '';

                            if (diaHorario) {
                                // Extract time (10h, 14:00, 09h, etc.)
                                const timeMatch = diaHorario.match(/(\d{1,2}):?(\d{2})?h?/);
                                if (timeMatch) {
                                    const hours = timeMatch[1];
                                    const minutes = timeMatch[2] || '00';
                                    time = `${hours}:${minutes}`;
                                }

                                // Extract date (amanhã, segunda, terça, etc.)
                                const dateLower = diaHorario.toLowerCase();
                                if (dateLower.includes('amanhã') || dateLower.includes('amanha')) {
                                    date = 'amanhã';
                                } else if (dateLower.includes('segunda')) {
                                    date = 'segunda-feira';
                                } else if (dateLower.includes('terça') || dateLower.includes('terca')) {
                                    date = 'terça-feira';
                                } else if (dateLower.includes('quarta')) {
                                    date = 'quarta-feira';
                                } else if (dateLower.includes('quinta')) {
                                    date = 'quinta-feira';
                                } else if (dateLower.includes('sexta')) {
                                    date = 'sexta-feira';
                                }
                            }

                            const toolArgs = { date, time, notes: `Agendamento via IA - ${diaHorario}` };
                            console.log(`[FSM Engine] Tool arguments:`, toolArgs);

                            const toolResult = await executeFSMTool(
                                toolName,
                                toolArgs,
                                {
                                    organizationId: input.organizationId,
                                    leadId: input.leadId,
                                    conversationId: input.conversationHistory[0]?.content || '',
                                }
                            );

                            console.log(`[FSM Engine] Tool '${toolName}' result:`, toolResult);

                            // Add tool result to reasoning
                            decisionResult.pensamento.push(
                                `🔧 Ferramenta executada: ${toolName}`,
                                toolResult.success ? `✅ ${toolResult.message}` : `❌ ${toolResult.message}`
                            );


                            // If tool failed, add to validation alerts and BLOCK transition
                            if (!toolResult.success) {
                                validationResult.alertas.push(`Ferramenta '${toolName}' falhou: ${toolResult.error}`);
                                console.warn(`[FSM Engine] Tool '${toolName}' failed. Blocking transition to '${finalNextState}'.`);
                                finalNextState = state.name; // Stay in current state to handle error
                            }

                            // If tool succeeded and returned data, update extractedData
                            if (toolResult.success && toolResult.data) {
                                console.log(`[FSM Engine] Tool '${toolName}' returned data:`, toolResult.data);
                                updatedExtractedData = {
                                    ...updatedExtractedData,
                                    ...toolResult.data
                                };

                                // Also save to DB immediately to persist tool results
                                await prisma.lead.update({
                                    where: { id: input.leadId },
                                    data: { extractedData: updatedExtractedData }
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error('[FSM Engine] Error executing tools:', error);
                    finalNextState = state.name; // Block transition on error
                }
            }

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
                const backoffMs = calculateBackoff(retryCount - 1); // 0-indexed for calculation
                console.warn(`[FSM Engine] Validation failed, retrying (${retryCount}/${MAX_RETRIES}) after ${backoffMs}ms`, {
                    justificativa: validationResult.justificativa,
                });
                lastError = new Error(validationResult.justificativa);

                // Wait before retry (exponential backoff: 1s, 2s, 4s)
                await delay(backoffMs);
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
                const backoffMs = calculateBackoff(retryCount - 1);
                console.warn(`[FSM Engine] Retrying after error in ${backoffMs}ms (${retryCount}/${MAX_RETRIES})`);
                await delay(backoffMs);
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
