import { prisma } from '../lib/prisma';

const AI_CONTROL_EMOJI = '🚫';
const AI_DISABLED_MESSAGE = 'IA desativada. Um atendente humano entrará em contato em breve.';

/**
 * Detecta se a mensagem contém o emoji de controle da IA
 */
export function containsAIControlEmoji(message: string): boolean {
    return message.trim() === AI_CONTROL_EMOJI;
}

/**
 * Desliga a IA para uma conversa específica
 */
export async function disableAI(conversationId: string): Promise<void> {
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { aiEnabled: false },
    });
}

/**
 * Retorna a mensagem de confirmação de desligamento da IA
 */
export function getAIDisabledMessage(): string {
    return AI_DISABLED_MESSAGE;
}

/**
 * Processa comando de controle da IA
 * Retorna true se a IA foi desligada
 */
export async function processAIControl(
    message: string,
    conversationId: string
): Promise<boolean> {
    if (containsAIControlEmoji(message)) {
        await disableAI(conversationId);
        return true;
    }
    return false;
}
