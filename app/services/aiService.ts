// AI Service - Core conversation engine with OpenAI integration
// Handles context loading, prompt building, FSM transitions, and action execution

import OpenAI from 'openai';
import { prisma } from '@/app/lib/prisma';
import { processEvent } from './crmService';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
});

interface AIContext {
    agent: any;
    conversation: any;
    lead: any;
    knowledge: any[];
    matrix: any[];
    states: any[];
    appointments: any[];
}

interface AIResponse {
    response: string;
    extractedData?: any;
    nextState?: string;
    action?: 'schedule_meeting' | 'update_status' | 'none';
    actionData?: any;
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
                    matrix: {
                        where: { organizationId },
                    },
                    states: {
                        where: { organizationId },
                        orderBy: { order: 'asc' },
                    },
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
        matrix: conversation.agent.matrix,
        states: conversation.agent.states,
        appointments,
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

ESTADO ATUAL FSM: ${currentState?.name || 'INICIO'}
MISSÃO DESTE ESTADO: ${currentState?.missionPrompt || 'Iniciar conversa e coletar informações'}

ROTAS DISPONÍVEIS:
${JSON.stringify(currentState?.availableRoutes || {}, null, 2)}

MATRIZ DE INSTRUÇÕES:
${context.matrix.map(m => `
Categoria: ${m.category}
Gatilho: ${m.title}
Resposta: ${m.response}
`).join('\n')}

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
    "response": "sua resposta ao cliente (seja natural e humano)",
    "extractedData": {
        "nome": "se cliente mencionou nome",
        "email": "se mencionou email",
        "empresa": "se mencionou empresa"
    },
    "nextState": "próximo estado FSM ou null",
    "action": "schedule_meeting | update_status | none",
    "actionData": {}
}`;
}

// Call OpenAI API
async function callOpenAI(prompt: string): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
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

// Process message with AI
export async function processMessage(params: {
    message: string;
    conversationId: string;
    organizationId: string;
}): Promise<string> {
    try {
        // 1. Load full context
        const context = await loadFullContext(
            params.conversationId,
            params.organizationId
        );

        // 2. Build prompt
        const prompt = buildPromptWithFSM(context, params.message);

        // 3. Call OpenAI
        const aiResponseRaw = await callOpenAI(prompt);
        const aiResponse: AIResponse = JSON.parse(aiResponseRaw);

        // 4. Update lead with extracted data
        if (aiResponse.extractedData && context.lead) {
            const currentData = (context.lead.extractedData as any) || {};
            await prisma.lead.update({
                where: { id: context.lead.id },
                data: {
                    extractedData: {
                        ...currentData,
                        ...aiResponse.extractedData,
                    },
                    name: aiResponse.extractedData.nome || context.lead.name,
                    email: aiResponse.extractedData.email || context.lead.email,
                },
            });
        }

        // 5. FSM state transition
        if (aiResponse.nextState && context.lead) {
            await prisma.lead.update({
                where: { id: context.lead.id },
                data: { currentState: aiResponse.nextState },
            });
        }

        // 6. Execute action if needed
        if (aiResponse.action && aiResponse.action !== 'none') {
            await executeAction(aiResponse.action, aiResponse.actionData, context);
        }

        // 7. Save AI response message
        await prisma.message.create({
            data: {
                conversationId: params.conversationId,
                content: aiResponse.response,
                fromMe: true,
                type: 'TEXT',
                messageId: crypto.randomUUID(),
            },
        });

        // 8. Update conversation timestamp
        await prisma.conversation.update({
            where: { id: params.conversationId },
            data: { updatedAt: new Date() },
        });

        // 9. Trigger CRM webhooks
        if (context.lead) {
            await processEvent('message.sent', params.organizationId, {
                lead: context.lead,
                message: { content: aiResponse.response },
            });
        }

        return aiResponse.response;
    } catch (error) {
        console.error('Error processing message:', error);
        return 'Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?';
    }
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
