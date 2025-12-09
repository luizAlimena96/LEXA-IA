// AI Service with Scheduling Integration
// Enhanced version with OpenAI function calling for scheduling

import OpenAI from 'openai';
import { prisma } from '@/app/lib/prisma';
import { schedulingTools } from './aiSchedulingTools';
import { withTimeout } from '@/app/lib/timeout-protection';
import {
    handleCheckAvailability,
    handleSuggestSlots,
    handleBookMeeting,
    handleRescheduleMeeting,
    handleCancelMeeting,
    handleListAppointments
} from './aiSchedulingHandlers';

// Maximum number of function calls to prevent infinite loops
const MAX_FUNCTION_CALLS = 10;

// Timeout for entire AI processing (30 seconds)
const AI_PROCESSING_TIMEOUT = 30000;

/**
 * Process message with AI and handle scheduling function calls
 */
export async function processMessageWithScheduling(params: {
    message: string;
    conversationId: string;
    organizationId: string;
    leadId?: string; // Optional for test interface
    media?: {
        type: string;
        base64: string;
        name?: string;
    };
}): Promise<{ response: string; functionCalled?: string; audioBase64?: string }> {
    const startTime = Date.now();

    try {
        // Get organization and API key
        const organization = await prisma.organization.findUnique({
            where: { id: params.organizationId },
            select: {
                openaiApiKey: true,
                openaiModel: true
            }
        });

        if (!organization?.openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }

        // Get conversation context
        const conversation = await prisma.conversation.findUnique({
            where: { id: params.conversationId },
            include: {
                messages: {
                    orderBy: { timestamp: 'desc' },
                    take: 10
                },
                lead: true,
                agent: {
                    include: {
                        states: true
                    }
                }
            }
        });

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // Get lead's appointments
        const appointments = await prisma.appointment.findMany({
            where: {
                leadId: params.leadId,
                status: 'SCHEDULED',
                scheduledAt: { gte: new Date() }
            },
            orderBy: { scheduledAt: 'asc' }
        });

        // Build conversation history
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            {
                role: 'system',
                content: buildSystemPrompt(conversation.agent, organization, appointments)
            }
        ];

        // Add conversation history
        conversation.messages.reverse().forEach(msg => {
            messages.push({
                role: msg.fromMe ? 'assistant' : 'user',
                content: msg.content
            });
        });

        // Add current message
        messages.push({
            role: 'user',
            content: params.message
        });

        // Call OpenAI with function calling
        const openai = new OpenAI({ apiKey: organization.openaiApiKey });

        let response = await openai.chat.completions.create({
            model: organization.openaiModel || 'gpt-4o-mini',
            messages,
            tools: schedulingTools.map(tool => ({
                type: 'function' as const,
                function: tool
            })),
            tool_choice: 'auto',
            temperature: 0.7,
            max_tokens: 1000
        });

        let assistantMessage = response.choices[0].message;
        let functionCalled: string | undefined;
        let functionCallCount = 0;

        // Handle function calls with iteration limit to prevent infinite loops
        while (
            assistantMessage.tool_calls &&
            assistantMessage.tool_calls.length > 0 &&
            functionCallCount < MAX_FUNCTION_CALLS
        ) {
            functionCallCount++;
            const toolCall = assistantMessage.tool_calls[0];

            // Type guard to ensure it's a function tool call
            if (toolCall.type !== 'function') {
                break;
            }

            const functionName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);

            console.log(`[AI Scheduling] Function called (${functionCallCount}/${MAX_FUNCTION_CALLS}): ${functionName}`, args);
            functionCalled = functionName;

            let functionResult: any;

            // Execute the function
            switch (functionName) {
                case 'check_meeting_availability':
                    functionResult = await handleCheckAvailability(args, params.organizationId);
                    break;
                case 'suggest_meeting_slots':
                    functionResult = await handleSuggestSlots(args, params.organizationId);
                    break;
                case 'book_meeting':
                    if (!params.leadId) {
                        functionResult = { error: 'Lead ID required for booking meetings' };
                    } else {
                        functionResult = await handleBookMeeting(
                            args,
                            params.organizationId,
                            params.leadId,
                            params.conversationId
                        );
                    }
                    break;
                case 'reschedule_meeting':
                    if (!params.leadId) {
                        functionResult = { error: 'Lead ID required for rescheduling meetings' };
                    } else {
                        functionResult = await handleRescheduleMeeting(args, params.organizationId, params.leadId);
                    }
                    break;
                case 'cancel_meeting':
                    if (!params.leadId) {
                        functionResult = { error: 'Lead ID required for canceling meetings' };
                    } else {
                        functionResult = await handleCancelMeeting(args, params.organizationId, params.leadId, params.conversationId);
                    }
                    break;
                case 'list_lead_appointments':
                    if (!params.leadId) {
                        functionResult = { success: true, appointments: [], message: 'Você não tem nenhuma reunião agendada no momento.' };
                    } else {
                        functionResult = await handleListAppointments(params.leadId);
                    }
                    break;
                default:
                    functionResult = { error: 'Unknown function' };
            }

            // Add function result to conversation
            messages.push(assistantMessage);
            messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(functionResult)
            });

            // Get AI's response after function execution
            response = await openai.chat.completions.create({
                model: organization.openaiModel || 'gpt-4o-mini',
                messages,
                temperature: 0.7,
                max_tokens: 1000
            });

            assistantMessage = response.choices[0].message;
        }

        // Warn if we hit the function call limit
        if (functionCallCount >= MAX_FUNCTION_CALLS) {
            console.warn(`[AI Scheduling] ⚠️ Maximum function calls (${MAX_FUNCTION_CALLS}) reached. Stopping to prevent infinite loop.`);
        }

        // Log performance metrics
        const duration = Date.now() - startTime;
        if (duration > 5000) {
            console.warn(`[AI Scheduling] ⚠️ Slow operation: ${duration}ms with ${functionCallCount} function calls`);
        } else {
            console.log(`[AI Scheduling] ✓ Completed in ${duration}ms with ${functionCallCount} function calls`);
        }

        const finalResponse = assistantMessage.content || 'Desculpe, não consegui processar sua mensagem.';

        return {
            response: finalResponse,
            functionCalled
        };

    } catch (error) {
        console.error('[AI Scheduling] Error:', error);
        throw error;
    }
}

/**
 * Build system prompt with scheduling context
 */
function buildSystemPrompt(agent: any, organization: any, appointments: any[]): string {
    const preparationHours = 24; // Default: 24 hours advance notice required

    let prompt = `Você é ${agent.name}, um assistente virtual inteligente.

## PERSONALIDADE E CONTEXTO
${agent.personality || 'Você é um assistente amigável e prestativo que ajuda clientes via WhatsApp.'}

## ⚠️ REGRA CRÍTICA DE AGENDAMENTO ⚠️
VOCÊ TEM FERRAMENTAS DISPONÍVEIS PARA AGENDAMENTO. VOCÊ **DEVE** USÁ-LAS.

Quando o cliente mencionar QUALQUER uma dessas palavras-chave:
- "agendar", "marcar", "reunião", "horário", "disponível", "quando", "data", "dia"

Você **DEVE OBRIGATORIAMENTE**:
1. CHAMAR A FERRAMENTA \`suggest_meeting_slots\` IMEDIATAMENTE
2. NÃO responder com texto genérico
3. NÃO perguntar preferências antes de mostrar opções
4. MOSTRAR os 3 horários disponíveis que a ferramenta retornar

## FERRAMENTAS DISPONÍVEIS
- \`suggest_meeting_slots\`: Mostra 3 próximos horários disponíveis
- \`check_meeting_availability\`: Verifica se um horário específico está livre
- \`book_meeting\`: Confirma um agendamento
- \`reschedule_meeting\`: Reagenda uma reunião existente
- \`cancel_meeting\`: Cancela uma reunião
- \`list_lead_appointments\`: Lista agendamentos do cliente

## FLUXO OBRIGATÓRIO
1. Cliente pede para agendar → CHAME \`suggest_meeting_slots\` (NÃO responda com texto)
2. Mostre os 3 horários retornados pela ferramenta
3. Cliente escolhe → CHAME \`book_meeting\`
4. Confirme o agendamento

REGRAS:
- Antecedência mínima: ${preparationHours} horas
- Não agendar para o mesmo dia
- Sempre use as ferramentas, nunca invente horários`;

    if (appointments.length > 0) {
        prompt += `\n\nAGENDAMENTOS ATUAIS DO CLIENTE:\n`;
        appointments.forEach((apt, i) => {
            const date = new Date(apt.scheduledAt).toLocaleDateString('pt-BR');
            const time = new Date(apt.scheduledAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            prompt += `${i + 1}. ${apt.title} - ${date} às ${time}\n`;
        });
    }

    if (agent.prohibitions) {
        prompt += `\n\nPROIBIÇÕES:\n${agent.prohibitions}`;
    }

    prompt += `\n\nSEJA NATURAL: Converse de forma natural e humana. Não mencione "ferramentas" ou termos técnicos. Seja empático e prestativo.`;

    return prompt;
}
