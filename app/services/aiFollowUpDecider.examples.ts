/**
 * Exemplo de Uso do AI Follow-up Decider
 * 
 * Este arquivo demonstra como integrar o decisor inteligente de follow-ups
 * no fluxo de conversas existente.
 */

import { decideFollowUpTiming, formatFollowUpDecision } from './aiFollowUpDecider';
import { prisma } from '@/app/lib/prisma';

/**
 * Exemplo 1: Análise simples de mensagem
 */
export async function exemploBasico() {
    const decision = await decideFollowUpTiming(
        {
            lastMessage: 'Vou no banco sexta-feira pegar o documento',
            currentDate: new Date('2024-12-06T14:00:00'), // Sexta-feira 14h
            leadName: 'João Silva',
        },
        process.env.OPENAI_API_KEY!
    );

    console.log(formatFollowUpDecision(decision));

    // Output esperado:
    // Follow-up Decision:
    // - Should Schedule: Yes
    // - Scheduled For: 09/12/2024 às 10:00 (segunda-feira)
    // - Reason: Lead vai ao banco sexta-feira. Bancos fecham cedo...
    // - Confidence: 90%
    // - Intent: ir no banco pegar documento
    // - Time Reference: sexta-feira
}

/**
 * Exemplo 2: Integração com sistema de follow-ups
 */
export async function agendarFollowUpInteligente(
    leadId: string,
    conversationId: string,
    lastMessage: string,
    organizationId: string
) {
    try {
        // 1. Buscar configuração da organização
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                openaiApiKey: true,
                openaiModel: true,
            },
        });

        if (!organization?.openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }

        // 2. Buscar contexto da conversa (últimas 5 mensagens)
        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { timestamp: 'desc' },
            take: 5,
            select: { content: true, fromMe: true },
        });

        const conversationContext = messages
            .reverse()
            .map(m => `${m.fromMe ? 'Agente' : 'Lead'}: ${m.content}`);

        // 3. Decidir timing do follow-up
        const decision = await decideFollowUpTiming(
            {
                lastMessage,
                currentDate: new Date(),
                conversationContext,
            },
            organization.openaiApiKey,
            organization.openaiModel || 'gpt-4o-mini'
        );

        console.log('[Follow-up Decider]', formatFollowUpDecision(decision));

        // 4. Criar follow-up agendado
        if (decision.shouldSchedule) {
            await prisma.followupLog.create({
                data: {
                    leadId,
                    followupId: 'auto-generated', // ID do follow-up padrão
                    scheduledFor: decision.scheduledFor,
                    status: 'PENDING',
                    metadata: {
                        aiDecision: true,
                        reason: decision.reason,
                        confidence: decision.confidence,
                        extractedIntent: decision.extractedIntent,
                    },
                },
            });

            console.log(`✅ Follow-up agendado para ${decision.scheduledFor.toLocaleString('pt-BR')}`);
        }

        return decision;
    } catch (error) {
        console.error('[Follow-up Decider] Error:', error);
        throw error;
    }
}

/**
 * Exemplo 3: Casos de teste
 */
export const casosDeTestе = [
    {
        mensagem: 'Vou no banco sexta-feira pegar o documento',
        dataAtual: new Date('2024-12-06T14:00:00'), // Sexta 14h
        resultadoEsperado: 'Segunda-feira 10h',
    },
    {
        mensagem: 'Vou ver isso amanhã de manhã',
        dataAtual: new Date('2024-12-05T16:00:00'), // Quinta 16h
        resultadoEsperado: 'Sexta-feira 14h',
    },
    {
        mensagem: 'Preciso falar com meu sócio, ele volta semana que vem',
        dataAtual: new Date('2024-12-05T10:00:00'),
        resultadoEsperado: 'Terça-feira próxima semana 10h',
    },
    {
        mensagem: 'Vou resolver isso hoje à tarde',
        dataAtual: new Date('2024-12-05T10:00:00'),
        resultadoEsperado: 'Hoje 14h-16h',
    },
    {
        mensagem: 'Não vou conseguir hoje, só segunda',
        dataAtual: new Date('2024-12-06T15:00:00'), // Sexta
        resultadoEsperado: 'Segunda-feira 10h',
    },
];

/**
 * Exemplo 4: Integração no webhook de mensagens
 */
export async function onMessageReceived(
    conversationId: string,
    message: string,
    fromMe: boolean
) {
    // Só processar mensagens do lead (não do agente)
    if (fromMe) return;

    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
            lead: true,
            agent: {
                select: {
                    followupEnabled: true,
                    organizationId: true,
                },
            },
        },
    });

    if (!conversation?.lead || !conversation.agent.followupEnabled) {
        return;
    }

    // Agendar follow-up inteligente
    await agendarFollowUpInteligente(
        conversation.lead.id,
        conversationId,
        message,
        conversation.agent.organizationId
    );
}
