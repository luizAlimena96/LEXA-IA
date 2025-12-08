/**
 * AI Follow-up Decider
 * Analisa a última mensagem do lead e decide quando enviar o próximo follow-up
 * considerando contexto temporal, dias úteis e horário comercial
 */

import OpenAI from 'openai';
import { addDays, addHours, setHours, setMinutes, isWeekend, nextMonday, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface FollowUpDecision {
    shouldSchedule: boolean;
    scheduledFor: Date;
    reason: string;
    confidence: number;
    extractedIntent: {
        timeReference?: string;  // "hoje", "amanhã", "segunda", "fim de semana"
        action?: string;          // "ir no banco", "pegar documento"
        estimatedDuration?: number; // em horas
    };
}

interface AnalysisInput {
    lastMessage: string;
    currentDate: Date;
    leadName?: string;
    conversationContext?: string[];
}

/**
 * Analisa a mensagem e decide quando agendar o follow-up
 */
export async function decideFollowUpTiming(
    input: AnalysisInput,
    openaiApiKey: string,
    model: string = 'gpt-4o-mini',
    customPrompt?: string | null
): Promise<FollowUpDecision> {
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const prompt = customPrompt || buildFollowUpDeciderPrompt(input);

    try {
        const completion = await openai.chat.completions.create({
            model,
            messages: [
                {
                    role: 'system',
                    content: 'Você é um especialista em análise temporal e agendamento inteligente de follow-ups. Retorne APENAS JSON válido.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
            throw new Error('No response from AI');
        }

        const aiDecision = JSON.parse(response);

        // Calcular data/hora do follow-up baseado na análise da IA
        const scheduledFor = calculateFollowUpDate(
            input.currentDate,
            aiDecision.timeReference,
            aiDecision.estimatedHours
        );

        return {
            shouldSchedule: aiDecision.shouldSchedule,
            scheduledFor,
            reason: aiDecision.reason,
            confidence: aiDecision.confidence,
            extractedIntent: {
                timeReference: aiDecision.timeReference,
                action: aiDecision.action,
                estimatedDuration: aiDecision.estimatedHours,
            },
        };
    } catch (error) {
        console.error('[Follow-up Decider] Error:', error);

        // Fallback: agendar para 24h depois em horário comercial
        return {
            shouldSchedule: true,
            scheduledFor: getNextBusinessDay(addHours(input.currentDate, 24)),
            reason: 'Erro na análise - usando fallback de 24h',
            confidence: 0.5,
            extractedIntent: {},
        };
    }
}

function buildFollowUpDeciderPrompt(input: AnalysisInput): string {
    const currentDay = format(input.currentDate, 'EEEE', { locale: ptBR });
    const currentTime = format(input.currentDate, 'HH:mm');
    const currentDateStr = format(input.currentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    const isWeekendDay = isWeekend(input.currentDate);
    const isFriday = currentDay.toLowerCase() === 'sexta-feira';

    return `Você é um especialista em análise temporal para agendamento de follow-ups.

**⏰ DATA/HORA ATUAL**: ${currentDateStr} (${currentDay})
${isFriday ? '⚠️ **ATENÇÃO**: Hoje é SEXTA-FEIRA - bancos fecham às 16h!' : ''}
${isWeekendDay ? '⚠️ **ATENÇÃO**: Hoje é FIM DE SEMANA - bancos fechados!' : ''}

**💬 ÚLTIMA MENSAGEM DO LEAD**:
"${input.lastMessage}"

${input.conversationContext ? `**📝 CONTEXTO DA CONVERSA**:\n${input.conversationContext.join('\n')}` : ''}

## 🎯 SUA MISSÃO

Analise a mensagem considerando o **DIA DA SEMANA ATUAL** e determine:
1. O que o lead vai fazer (ação)
2. Quando ele pretende fazer (inferir baseado no contexto)
3. Quanto tempo vai levar
4. Melhor momento para o follow-up

## ⚠️ REGRAS CRÍTICAS

### Contexto de Sexta-feira
- Se HOJE é sexta e lead diz "vou no banco" → provavelmente vai HOJE
- Banco fecha 16h na sexta
- Se já passou das 14h → improvável conseguir
- **SOLUÇÃO**: Agendar follow-up para SEGUNDA 10h

### Contexto de Dias Úteis
- "Vou no banco" em segunda-quinta → pode ser hoje ou amanhã
- Dar 4-6h de buffer
- Se após 16h → próximo dia útil 10h

### Contexto de Fim de Semana
- Se hoje é sábado/domingo → próxima segunda 10h
- Bancos fechados no fim de semana

## 📋 EXEMPLOS CONTEXTUAIS

**Exemplo 1**: 
- Mensagem: "Vou no banco"
- Dia atual: Sexta-feira 14:00
- Análise: Lead vai hoje, mas banco fecha 16h. Pode não conseguir.
- Follow-up: Segunda-feira 10:00 (72h depois)

**Exemplo 2**:
- Mensagem: "Vou no banco"
- Dia atual: Terça-feira 10:00
- Análise: Lead vai hoje ou amanhã. Tempo suficiente.
- Follow-up: Terça-feira 16:00 (6h depois)

**Exemplo 3**:
- Mensagem: "Vou pegar o documento"
- Dia atual: Quinta-feira 17:00
- Análise: Já passou horário comercial.
- Follow-up: Sexta-feira 14:00 (21h depois)

**Exemplo 4**:
- Mensagem: "Preciso resolver isso"
- Dia atual: Sexta-feira 15:00
- Análise: Sexta tarde, pouco tempo.
- Follow-up: Segunda-feira 10:00

## 🔍 INFERÊNCIA TEMPORAL

Quando o lead NÃO menciona tempo explicitamente:
- Assuma que vai fazer "hoje" ou "nos próximos dias"
- Considere o dia da semana atual
- Considere horário atual
- Seja conservador: melhor dar mais tempo

## 📤 RETORNE JSON

\`\`\`json
{
  "shouldSchedule": true,
  "timeReference": "hoje" | "amanhã" | "segunda-feira" | "próxima semana" | null,
  "action": "ir no banco",
  "estimatedHours": 72,
  "reason": "Lead disse 'vou no banco' na sexta-feira às 14h. Banco fecha às 16h e pode não conseguir. Agendando para segunda 10h.",
  "confidence": 0.85
}
\`\`\`

**IMPORTANTE**: 
- Sempre considere o **DIA DA SEMANA ATUAL**
- Sexta-feira = risco alto de não conseguir
- Seja específico no \`reason\`
- \`estimatedHours\`: horas até o follow-up

Retorne APENAS o JSON, sem markdown.`;
}

/**
 * Calcula a data do follow-up baseado na referência temporal
 */
function calculateFollowUpDate(
    currentDate: Date,
    timeReference: string | null,
    estimatedHours: number = 24
): Date {
    let targetDate = new Date(currentDate);

    // Se tem referência temporal específica, usar ela
    if (timeReference) {
        const ref = timeReference.toLowerCase();

        if (ref.includes('segunda')) {
            targetDate = nextMonday(currentDate);
            targetDate = setHours(targetDate, 10);
            targetDate = setMinutes(targetDate, 0);
        } else if (ref.includes('terça')) {
            targetDate = nextMonday(currentDate);
            targetDate = addDays(targetDate, 1);
            targetDate = setHours(targetDate, 10);
        } else if (ref.includes('sexta') || ref.includes('fim de semana')) {
            // Se mencionou sexta ou fim de semana, agendar para segunda
            targetDate = nextMonday(currentDate);
            targetDate = setHours(targetDate, 10);
        } else if (ref.includes('amanhã')) {
            targetDate = addDays(currentDate, 1);
            targetDate = setHours(targetDate, 14); // 14h do dia seguinte
        } else if (ref.includes('hoje')) {
            targetDate = addHours(currentDate, 4); // 4h depois
        } else if (ref.includes('semana que vem')) {
            targetDate = nextMonday(currentDate);
            targetDate = addDays(targetDate, 1); // Terça da próxima semana
            targetDate = setHours(targetDate, 10);
        } else {
            // Usar estimatedHours
            targetDate = addHours(currentDate, estimatedHours);
        }
    } else {
        // Sem referência temporal, usar estimatedHours
        targetDate = addHours(currentDate, estimatedHours);
    }

    // Garantir que está em dia útil e horário comercial
    targetDate = getNextBusinessDay(targetDate);
    targetDate = adjustToBusinessHours(targetDate);

    return targetDate;
}

/**
 * Ajusta para o próximo dia útil se cair em fim de semana
 */
function getNextBusinessDay(date: Date): Date {
    let result = new Date(date);

    while (isWeekend(result)) {
        result = addDays(result, 1);
    }

    return result;
}

/**
 * Ajusta para horário comercial (9h-18h)
 */
function adjustToBusinessHours(date: Date): Date {
    const hour = date.getHours();
    let result = new Date(date);

    if (hour < 9) {
        result = setHours(result, 9);
        result = setMinutes(result, 0);
    } else if (hour >= 18) {
        // Próximo dia útil às 9h
        result = addDays(result, 1);
        result = getNextBusinessDay(result);
        result = setHours(result, 9);
        result = setMinutes(result, 0);
    }

    return result;
}

/**
 * Helper para formatar a decisão para log
 */
export function formatFollowUpDecision(decision: FollowUpDecision): string {
    return `
Follow-up Decision:
- Should Schedule: ${decision.shouldSchedule ? 'Yes' : 'No'}
- Scheduled For: ${format(decision.scheduledFor, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
- Reason: ${decision.reason}
- Confidence: ${(decision.confidence * 100).toFixed(0)}%
- Intent: ${decision.extractedIntent.action || 'N/A'}
- Time Reference: ${decision.extractedIntent.timeReference || 'N/A'}
    `.trim();
}
