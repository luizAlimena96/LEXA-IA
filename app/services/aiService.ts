// AI Service - Core conversation engine with OpenAI integration
// Handles context loading, prompt building, FSM transitions, and action execution

import OpenAI from 'openai';
import { prisma } from '@/app/lib/prisma';
import { processEvent } from './crmService';
import { transcribeAudio } from './transcriptionService';
import * as elevenLabsService from './elevenLabsService';

// OpenAI client will be instantiated per request


interface AIContext {
    agent: any;
    conversation: any;
    lead: any;
    knowledge: any[];
    states: any[];
    appointments: any[];
    organization?: any;
}

interface AIResponse {
    response: string;
    extractedData?: any;
    nextState?: string;
    action?: 'schedule_meeting' | 'update_status' | 'none';
    actionData?: any;
    thinking?: string;
}

// Load complete context for AI processing
export async function loadFullContext(
    conversationId: string,
    organizationId: string
): Promise<AIContext> {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
            messages: {
                orderBy: { timestamp: 'asc' },
                take: 50, // Last 50 messages for context
            },
            lead: true,
            agent: {
                include: {
                    knowledge: {
                        where: { organizationId },
                        take: 20,
                    },
                    states: {
                        where: { organizationId },
                        orderBy: { order: 'asc' },
                    },
                },
            },
            organization: {
                select: {
                    id: true,
                    elevenLabsVoiceId: true,
                    elevenLabsApiKey: true,
                    elevenLabsModel: true,
                },
            },
        },
    });

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    // Get upcoming appointments for this lead
    const appointments = conversation.leadId
        ? await prisma.appointment.findMany({
            where: {
                leadId: conversation.leadId,
                scheduledAt: { gte: new Date() },
            },
            orderBy: { scheduledAt: 'asc' },
            take: 5,
        })
        : [];

    return {
        agent: conversation.agent,
        conversation,
        lead: conversation.lead,
        knowledge: conversation.agent.knowledge,
        states: conversation.agent.states,
        appointments,
        organization: conversation.organization,
    };
}

// Build prompt with FSM context
function buildPromptWithFSM(context: AIContext, userMessage: string): string {
    const currentState = context.states.find(
        s => s.name === context.lead?.currentState
    ) || context.states[0];

    const conversationHistory = context.conversation.messages
        .map((m: any) => `${m.role === 'user' ? 'Cliente' : 'Você'}: ${m.content}`)
        .join('\n');

    return `VOCÊ É: ${context.agent.name}
PERSONALIDADE: ${context.agent.personality || 'Amigável e prestativo'}
TOM: ${context.agent.tone}

INSTRUÇÕES DO SISTEMA:
${context.agent.systemPrompt || 'Você é um assistente virtual que ajuda clientes via WhatsApp.'}

${context.agent.instructions ? `INSTRUÇÕES ESPECÍFICAS:\n${context.agent.instructions}\n` : ''}
${context.agent.writingStyle ? `ESTILO DE ESCRITA:\n${context.agent.writingStyle}\n` : ''}
${context.agent.prohibitions ? `PROIBIÇÕES GLOBAIS:\n${context.agent.prohibitions}\n` : ''}


ESTADO ATUAL FSM: ${currentState?.name || 'INICIO'}
MISSÃO DESTE ESTADO: ${currentState?.missionPrompt || 'Iniciar conversa e coletar informações'}

ROTAS DISPONÍVEIS:
${JSON.stringify(currentState?.availableRoutes || {}, null, 2)}

BASE DE CONHECIMENTO:
${context.knowledge.map(k => `${k.title}: ${k.content}`).join('\n')}

HISTÓRICO DA CONVERSA:
${conversationHistory}

DADOS JÁ COLETADOS:
Nome: ${context.lead?.name || 'não informado'}
Email: ${context.lead?.email || 'não informado'}
Telefone: ${context.lead?.phone}
Status: ${context.lead?.status}
${context.lead?.extractedData ? `Dados extras: ${JSON.stringify(context.lead.extractedData)}` : ''}

REUNIÕES AGENDADAS:
${context.appointments.length > 0
            ? context.appointments.map(a =>
                `${new Date(a.scheduledAt).toLocaleString('pt-BR')}: ${a.title}`
            ).join('\n')
            : 'Nenhuma reunião agendada'
        }

NOVA MENSAGEM DO CLIENTE:
${userMessage}

RESPONDA EM JSON VÁLIDO:
{
    "thinking": "Seu raciocínio passo a passo sobre o estado atual, intenção do usuário e qual resposta dar",
    "response": "sua resposta ao cliente (seja natural e humano)",
    "extractedData": {
        "nome": "se cliente mencionou nome",
        "email": "se mencionou email",
        "empresa": "se mencionou empresa"
    },
    "nextState": "ID do item da MATRIZ que melhor se aplica ou null",
    "action": "schedule_meeting | update_status | none",
    "actionData": {}
}`;
}

// Call OpenAI API
async function callOpenAI(prompt: string, apiKey: string, model: string = 'gpt-4-turbo-preview'): Promise<string> {
    try {
        const openai = new OpenAI({ apiKey });

        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'Você é um assistente de IA que responde SEMPRE em JSON válido.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: 'json_object' },
        });

        return response.choices[0].message.content || '{}';
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw error;
    }
}

// Process message with AI using the new 3-AI FSM Engine
export async function processMessage(params: {
    message: string;
    conversationId: string;
    organizationId: string;
    media?: {
        type: string;
        base64: string;
        name?: string;
    };
    customPrompts?: {
        dataExtractor?: string | null;
        stateDecider?: string | null;
        validator?: string | null;
    };
}): Promise<{ response: string; audioBase64?: string }> {
    try {
        // 1. Load full context
        const context = await loadFullContext(
            params.conversationId,
            params.organizationId
        );

        // 2. Get Organization API Key
        const organization = await prisma.organization.findUnique({
            where: { id: params.organizationId },
            select: { openaiApiKey: true, openaiModel: true }
        });

        const apiKey = organization?.openaiApiKey || process.env.OPENAI_API_KEY;

        if (!apiKey) {
            console.error('OpenAI API Key not found for organization:', params.organizationId);
            throw new Error('OpenAI API Key not found');
        }

        // --- MEDIA HANDLING ---
        let finalMessage = params.message;

        if (params.media) {
            try {
                if (params.media.type.startsWith('audio/')) {
                    const transcription = await transcribeAudio(params.media.base64, apiKey);
                    finalMessage = `[ÁUDIO TRANSCRITO]: ${transcription}`;
                    if (params.message) finalMessage += `\n[COMENTÁRIO ADICIONAL]: ${params.message}`;
                } else if (params.media.type === 'text/plain') {
                    const textContent = Buffer.from(params.media.base64, 'base64').toString('utf-8');
                    finalMessage = `[CONTEÚDO DO ARQUIVO ${params.media.name || 'texto.txt'}]:\n${textContent}\n\n[MENSAGEM DO USUÁRIO]: ${params.message}`;
                } else {
                    finalMessage = `[ARQUIVO RECEBIDO]: ${params.media.name} (Tipo: ${params.media.type}) - Conteúdo não lido.\n[MENSAGEM]: ${params.message}`;
                }
            } catch (err) {
                console.error('Error processing media:', err);
                finalMessage = `[ERRO AO PROCESSAR ARQUIVO]: ${err}\n${params.message}`;
            }
        }

        // 3. Use the new FSM Engine with 3 AIs
        const { decideNextState } = await import('@/app/lib/fsm-engine');

        const conversationHistory = context.conversation.messages.map((m: any) => ({
            role: m.fromMe ? 'assistant' : 'user',
            content: m.content,
        }));

        const fsmDecision = await decideNextState({
            agentId: context.agent.id,
            currentState: context.lead?.currentState || context.states[0]?.name || 'INICIO',
            lastMessage: finalMessage, // Use extracted/transcribed message
            extractedData: (context.lead?.extractedData as any) || {},
            conversationHistory,
            leadId: context.lead?.id,
            organizationId: params.organizationId,
            customPrompts: params.customPrompts,
        });

        console.log('[AI Service] FSM Decision:', {
            nextState: fsmDecision.nextState,
            approved: fsmDecision.validation.approved,
            confidence: fsmDecision.validation.confidence,
            metrics: fsmDecision.metrics,
        });

        // 4. Update lead with extracted data and new state
        if (context.lead) {
            const updateData: any = {
                currentState: fsmDecision.nextState,
            };

            if (fsmDecision.shouldExtractData && Object.keys(fsmDecision.extractedData).length > 0) {
                updateData.extractedData = fsmDecision.extractedData;

                // Update specific fields if present
                if (fsmDecision.extractedData.nome_cliente) {
                    updateData.name = fsmDecision.extractedData.nome_cliente;
                }
                if (fsmDecision.extractedData.email) {
                    updateData.email = fsmDecision.extractedData.email;
                }
            }

            await prisma.lead.update({
                where: { id: context.lead.id },
                data: updateData,
            });

            // 5. Trigger automations for this new state
            const { executeAutomationsForState } = await import('./crmAutomationService');
            await executeAutomationsForState(context.lead.id, fsmDecision.nextState);

            // 6. Trigger Agent Notifications
            const { checkAndTriggerNotifications } = await import('./agentNotificationService');
            await checkAndTriggerNotifications(context.lead.id, fsmDecision.nextState);
        }

        // 7. Generate natural language response using the new state
        const newState = context.states.find(s => s.name === fsmDecision.nextState);
        const responsePrompt = buildResponsePrompt(context, finalMessage, newState, fsmDecision);

        const openai = new OpenAI({ apiKey });
        const responseCompletion = await openai.chat.completions.create({
            model: organization?.openaiModel || 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Você é um assistente de IA que responde de forma natural e humana.',
                },
                {
                    role: 'user',
                    content: responsePrompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        const naturalResponse = responseCompletion.choices[0].message.content || 'Desculpe, não consegui processar sua mensagem.';

        // Clean up response text - fix common formatting issues
        const cleanedResponse = naturalResponse
            .replace(/\/n/g, '\n')  // Fix /n to actual line breaks
            .replace(/\\n/g, '\n')  // Fix \n to actual line breaks
            .trim();

        // --- AUDIO GENERATION (TTS) ---
        let audioBase64: string | undefined;

        const userSentAudio = params.media?.type.startsWith('audio/');

        // Debug: Check audio generation conditions
        console.log('[Audio Debug] Checking audio generation:', {
            userSentAudio,
            hasVoiceId: !!context.organization?.elevenLabsVoiceId,
            voiceId: context.organization?.elevenLabsVoiceId,
            hasOrgApiKey: !!context.organization?.elevenLabsApiKey,
            organizationId: context.organization?.id,
        });

        // Check if organization has Voice ID and API Key configured AND user sent audio
        const elevenLabsApiKey = context.organization?.elevenLabsApiKey;

        if (userSentAudio && context.organization?.elevenLabsVoiceId && elevenLabsApiKey) {
            try {
                console.log('[Audio Debug] Generating audio with ElevenLabs...');
                // Generate audio
                const audioBuffer = await elevenLabsService.textToSpeech(
                    cleanedResponse,
                    context.organization.elevenLabsVoiceId,
                    elevenLabsApiKey
                );
                audioBase64 = audioBuffer.toString('base64');
                console.log('[Audio Debug] Audio generated successfully, length:', audioBase64.length);
            } catch (err) {
                console.error('[Audio Debug] Error generating TTS:', err);
                // Fail silently on audio, return text only
            }
        } else {
            if (!userSentAudio) {
                console.log('[Audio Debug] Audio generation skipped - user sent text, not audio');
            } else {
                console.log('[Audio Debug] Audio generation skipped - missing Voice ID or API Key');
            }
        }

        // 8. Save AI response message with FSM thinking
        const thinkingText = fsmDecision.reasoning.join('\n');

        const aiMessage = await prisma.message.create({
            data: {
                conversationId: params.conversationId,
                content: cleanedResponse,
                fromMe: true,
                type: audioBase64 ? 'AUDIO' : 'TEXT',
                thought: thinkingText, // Save FSM reasoning as thought
                messageId: crypto.randomUUID(),
            },
        });

        // Emit SSE event for real-time updates
        const { messageEventEmitter } = await import('@/app/lib/eventEmitter');
        messageEventEmitter.emit(params.conversationId, {
            type: 'new-message',
            message: {
                id: aiMessage.id,
                content: aiMessage.content,
                time: new Date(aiMessage.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                sent: true,
                read: false,
                role: 'assistant',
            },
        });

        // 9. Update conversation timestamp
        await prisma.conversation.update({
            where: { id: params.conversationId },
            data: { updatedAt: new Date() },
        });

        // 10. Create Debug Log
        try {
            const { createDebugLog } = await import('./debugService');
            await createDebugLog({
                phone: context.lead?.phone || 'unknown',
                conversationId: params.conversationId,
                clientMessage: finalMessage,
                aiResponse: cleanedResponse,
                currentState: fsmDecision.nextState,
                aiThinking: thinkingText,
                organizationId: params.organizationId,
                agentId: context.agent.id,
                leadId: context.lead?.id,
            });
        } catch (logError) {
            console.error('Failed to create debug log:', logError);
        }

        // 11. Trigger CRM webhooks
        if (context.lead) {
            await processEvent('message.sent', params.organizationId, {
                lead: context.lead,
                message: { content: cleanedResponse },
            });
        }

        return {
            response: cleanedResponse,
            audioBase64
        };
    } catch (error) {
        console.error('Error processing message:', error);
        throw error;
    }
}

// Build prompt for generating natural response
function buildResponsePrompt(
    context: AIContext,
    userMessage: string,
    newState: any,
    fsmDecision: any
): string {
    return `VOCÊ É: ${context.agent.name}
PERSONALIDADE: ${context.agent.personality || 'Amigável e prestativo'}
TOM: ${context.agent.tone}

INSTRUÇÕES DO SISTEMA:
${context.agent.systemPrompt || 'Você é um assistente virtual que ajuda clientes via WhatsApp.'}

${context.agent.instructions ? `INSTRUÇÕES ESPECÍFICAS:\n${context.agent.instructions}\n` : ''}
${context.agent.writingStyle ? `ESTILO DE ESCRITA:\n${context.agent.writingStyle}\n` : ''}
${context.agent.prohibitions ? `PROIBIÇÕES GLOBAIS:\n${context.agent.prohibitions}\n` : ''}

ESTADO ATUAL: ${newState?.name || 'INICIO'}
MISSÃO DESTE ESTADO: ${newState?.missionPrompt || 'Iniciar conversa e coletar informações'}

DADOS JÁ COLETADOS:
${JSON.stringify(fsmDecision.extractedData, null, 2)}

ÚLTIMA MENSAGEM DO CLIENTE:
${userMessage}

DECISÃO DO MOTOR FSM:
${fsmDecision.reasoning.slice(-5).join('\n')}

GERE UMA RESPOSTA NATURAL E HUMANA que:
1. Seja coerente com a missão do estado atual
2. Seja natural e conversacional (não mencione "motor FSM" ou termos técnicos)
3. Guie o usuário para fornecer as informações necessárias
4. Seja empática e prestativa

Responda APENAS com o texto da mensagem, sem JSON ou formatação adicional.`;
}

// Execute actions based on AI decision
async function executeAction(
    action: string,
    actionData: any,
    context: AIContext
) {
    switch (action) {
        case 'schedule_meeting':
            // Will be implemented with schedulingService
            console.log('Schedule meeting action:', actionData);
            break;

        case 'update_status':
            if (context.lead && actionData.status) {
                await prisma.lead.update({
                    where: { id: context.lead.id },
                    data: { status: actionData.status },
                });
            }
            break;

        default:
            console.log('Unknown action:', action);
    }
}
