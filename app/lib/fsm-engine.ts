/**
 * FSM Decision Engine
 * 
 * Motor de decisão para máquina de estados finitos (FSM)
 * Baseado no sistema antigo de regras de fluxo
 */

import { prisma } from '@/app/lib/prisma';

interface DecisionInput {
    agentId: string;
    currentState: string;
    lastMessage: string;
    extractedData: Record<string, any>;
    conversationHistory: Array<{ role: string; content: string }>;
}

interface DecisionOutput {
    nextState: string;
    reasoning: string[];
    shouldExtractData: boolean;
    dataToExtract?: string;
}

interface Route {
    estado: string;
    descricao: string;
}

interface AvailableRoutes {
    rota_de_sucesso: Route[];
    rota_de_persistencia: Route[];
    rota_de_escape: Route[];
}

/**
 * Motor de Decisão Hierárquico
 * 
 * Baseado na lógica do sistema antigo:
 * - PASSO 1: Verificação de memória (dados já coletados)
 * - PASSO 2: Análise da mensagem
 * - Lógica de seleção de rota
 */
export async function decideNextState(input: DecisionInput): Promise<DecisionOutput> {
    const reasoning: string[] = [];

    reasoning.push('Iniciando execução conforme as Leis.');
    reasoning.push('PASSO 1: VERIFICAÇÃO DE MEMÓRIA');

    // Buscar estado atual
    const state = await prisma.state.findFirst({
        where: {
            agentId: input.agentId,
            name: input.currentState,
        },
    });

    if (!state) {
        reasoning.push(`- Estado '${input.currentState}' não encontrado.`);
        return {
            nextState: 'INICIO',
            reasoning,
            shouldExtractData: false,
        };
    }

    const routes = state.availableRoutes as unknown as AvailableRoutes;
    const dataKey = state.dataKey;

    reasoning.push(`- CHAVE_DE_VALIDACAO_DO_ESTADO: '${dataKey}'.`);

    // PASSO 1: Verificação de Memória
    if (dataKey && dataKey !== 'vazio') {
        reasoning.push('- CONDIÇÃO NORMAL: Verificando se a chave existe em DADOS_JÁ_COLETADOS.');

        if (input.extractedData && input.extractedData[dataKey]) {
            const value = input.extractedData[dataKey];
            reasoning.push(`- A chave '${dataKey}' existe com valor '${value}' (não-nulo, tipo válido).`);
            reasoning.push('- VEREDITO: SUCESSO IMEDIATO.');
            reasoning.push('- Ignorando HISTÓRICO e PASSO 2.');

            // Escolher rota de sucesso
            const successRoute = routes.rota_de_sucesso[0];
            if (successRoute) {
                reasoning.push('LÓGICA DE SELEÇÃO DE ROTA');
                reasoning.push('- Veredito SUCESSO: Escolhendo rota_de_sucesso.');
                reasoning.push(`- Estado: '${successRoute.estado}'.`);
                reasoning.push('CONCLUSÃO');
                reasoning.push(`- Estado escolhido: '${successRoute.estado}'.`);

                return {
                    nextState: successRoute.estado,
                    reasoning,
                    shouldExtractData: false,
                };
            }
        } else {
            reasoning.push(`- A chave '${dataKey}' NÃO existe em DADOS_JÁ_COLETADOS.`);
            reasoning.push('- VEREDITO: PENDENTE, prosseguir para PASSO 2.');
        }
    } else if (dataKey === 'vazio') {
        reasoning.push('- CONDIÇÃO ESPECIAL (LÓGICA SEMÂNTICA): chave é "vazio".');
        reasoning.push('- Analisando intenção semântica da última mensagem.');

        // Análise semântica simples (pode ser melhorada com IA)
        const message = input.lastMessage.toLowerCase();

        // Tentar match com descrições das rotas
        for (const route of routes.rota_de_sucesso) {
            const keywords = extractKeywords(route.descricao);
            if (keywords.some(keyword => message.includes(keyword.toLowerCase()))) {
                reasoning.push(`- Correspondência encontrada com rota: '${route.estado}'.`);
                reasoning.push('CONCLUSÃO');
                reasoning.push(`- Estado escolhido: '${route.estado}'.`);

                return {
                    nextState: route.estado,
                    reasoning,
                    shouldExtractData: false,
                };
            }
        }
    }

    // PASSO 2: Análise da Mensagem
    reasoning.push('PASSO 2: ANÁLISE DA MENSAGEM (VEREDITO FINAL)');
    reasoning.push(`- Última mensagem do cliente: '${input.lastMessage}'.`);

    // Verificar se a mensagem está alinhada com o objetivo
    const isAligned = await analyzeMessageAlignment(
        input.lastMessage,
        state.missionPrompt,
        dataKey || ''
    );

    if (isAligned) {
        reasoning.push('- A mensagem está alinhada com o objetivo da missão atual.');
        reasoning.push('- VEREDITO: SUCESSO.');

        const successRoute = routes.rota_de_sucesso[0];
        if (successRoute) {
            reasoning.push('LÓGICA DE SELEÇÃO DE ROTA');
            reasoning.push('- Veredito SUCESSO: Escolhendo rota_de_sucesso.');
            reasoning.push(`- Estado: '${successRoute.estado}'.`);
            reasoning.push('CONCLUSÃO');
            reasoning.push(`- Estado escolhido: '${successRoute.estado}'.`);

            return {
                nextState: successRoute.estado,
                reasoning,
                shouldExtractData: true,
                dataToExtract: dataKey || undefined,
            };
        }
    } else {
        reasoning.push('- A mensagem NÃO está alinhada ou é ambígua.');
        reasoning.push('- VEREDITO: FALHA.');

        // Escolher rota de persistência
        const persistenceRoute = routes.rota_de_persistencia[0];
        if (persistenceRoute) {
            reasoning.push('LÓGICA DE SELEÇÃO DE ROTA');
            reasoning.push('- Veredito FALHA: Escolhendo rota_de_persistencia.');
            reasoning.push(`- Estado: '${persistenceRoute.estado}'.`);
            reasoning.push('CONCLUSÃO');
            reasoning.push(`- Estado escolhido: '${persistenceRoute.estado}'.`);

            return {
                nextState: persistenceRoute.estado,
                reasoning,
                shouldExtractData: false,
            };
        }
    }

    // Fallback: manter estado atual
    reasoning.push('- Nenhuma rota adequada encontrada, mantendo estado atual.');
    return {
        nextState: input.currentState,
        reasoning,
        shouldExtractData: false,
    };
}

/**
 * Extrai palavras-chave de uma descrição
 */
function extractKeywords(description: string): string[] {
    // Remove pontuação e divide em palavras
    const words = description
        .toLowerCase()
        .replace(/[^\w\sáéíóúâêôãõç]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3); // Apenas palavras com mais de 3 letras

    return words;
}

/**
 * Analisa se a mensagem está alinhada com o objetivo
 * (Versão simplificada - pode ser melhorada com IA)
 */
async function analyzeMessageAlignment(
    message: string,
    missionPrompt: string,
    dataKey: string
): Promise<boolean> {
    // Respostas muito curtas ou genéricas não são válidas
    const genericResponses = ['sim', 'não', 'ok', 'pode', 'talvez'];
    if (genericResponses.includes(message.toLowerCase().trim())) {
        return false;
    }

    // Se a mensagem tem conteúdo substancial (mais de 3 palavras), considerar válida
    const words = message.trim().split(/\s+/);
    if (words.length >= 3) {
        return true;
    }

    return false;
}

/**
 * Extrai dados da mensagem baseado no dataKey
 */
export async function extractDataFromMessage(
    message: string,
    dataKey: string,
    dataType: string
): Promise<any> {
    // Lógica de extração baseada no tipo
    switch (dataType) {
        case 'string':
            return message.trim();

        case 'boolean':
            const lowerMessage = message.toLowerCase();
            if (lowerMessage.includes('sim') || lowerMessage.includes('quero') || lowerMessage.includes('aceito')) {
                return true;
            }
            if (lowerMessage.includes('não') || lowerMessage.includes('nao')) {
                return false;
            }
            return null;

        case 'number':
            const numbers = message.match(/\d+/g);
            return numbers ? parseInt(numbers[0]) : null;

        default:
            return message.trim();
    }
}
