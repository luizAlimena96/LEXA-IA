import { ExtractionInput, DecisionInputForAI, ValidationInput } from './types';
import { DATA_EXTRACTOR_SYSTEM_PROMPT, STATE_DECIDER_SYSTEM_PROMPT, VALIDATOR_SYSTEM_PROMPT } from './system-prompts';

// ==================== IA 1: DATA EXTRACTOR ====================

export function buildDataExtractorPrompt(
  input: ExtractionInput,
  customPrompt?: string | null
): string {
  const { message, dataKey, dataType, dataDescription, currentExtractedData, conversationHistory, agentContext } = input;

  if (!dataKey || dataKey === 'vazio') {
    // Keep the "no extraction needed" logic as it's efficient
    return customPrompt || `Você é um extrator de dados. O estado atual não requer extração (dataKey: "${dataKey || 'vazio'}"). Retorne JSON vazio.`;
  }

  // Construct the full prompt using the new system prompt + dynamic context
  const fullPrompt = `${customPrompt || DATA_EXTRACTOR_SYSTEM_PROMPT}

# CONTEXTO DO AGENTE

**Nome do Agente**: ${agentContext.name}
${agentContext.personality ? `**Personalidade**: ${agentContext.personality}` : ''}
${agentContext.tone ? `**Tom de Voz**: ${agentContext.tone}` : ''}
${agentContext.systemPrompt ? `**System Prompt**: ${agentContext.systemPrompt}` : ''}
${agentContext.instructions ? `**Instruções Específicas**: ${agentContext.instructions}` : ''}
${agentContext.writingStyle ? `**Estilo de Escrita**: ${agentContext.writingStyle}` : ''}
${agentContext.prohibitions ? `**PROIBIÇÕES GLOBAIS DO AGENTE**: ${agentContext.prohibitions}` : ''}

# CONTEXTO DINÂMICO DA EXECUÇÃO

## CAMPO A EXTRAIR
- **Chave**: ${dataKey}
- **Tipo Esperado**: ${dataType || 'string'}
- **Descrição**: ${dataDescription || 'Não especificada'}

## DADOS JÁ COLETADOS
\`\`\`json
${JSON.stringify(currentExtractedData, null, 2)}
\`\`\`

## <conversa>
${conversationHistory.map(msg => `${msg.role === 'user' ? 'Cliente' : 'Atendente'}: ${msg.content}`).join('\n')}
## <conversa/>

## MENSAGEM MAIS RECENTE
"${message}"
`;

  return fullPrompt;
}

// ==================== IA 2: STATE DECIDER ====================

export function buildStateDeciderPrompt(
  input: DecisionInputForAI,
  customPrompt?: string | null
): string {
  const { currentState, missionPrompt, dataKey, extractedData, lastMessage, conversationHistory, availableRoutes, prohibitions, agentContext, knowledgeContext } = input;
  const basePrompt = customPrompt || STATE_DECIDER_SYSTEM_PROMPT;

  return `${basePrompt}

# CONTEXTO DO AGENTE

**Nome do Agente**: ${agentContext.name}
${agentContext.personality ? `**Personalidade**: ${agentContext.personality}` : ''}
${agentContext.tone ? `**Tom de Voz**: ${agentContext.tone}` : ''}
${agentContext.systemPrompt ? `**System Prompt**: ${agentContext.systemPrompt}` : ''}
${agentContext.instructions ? `**Instruções Específicas**: ${agentContext.instructions}` : ''}
${agentContext.writingStyle ? `**Estilo de Escrita**: ${agentContext.writingStyle}` : ''}
${agentContext.prohibitions ? `**PROIBIÇÕES GLOBAIS DO AGENTE**: ${agentContext.prohibitions}` : ''}
${knowledgeContext ? `\n# BASE DE CONHECIMENTO RELEVANTE\n${knowledgeContext}` : ''}

# CONTEXTO DA EXECUÇÃO ATUAL (PREENCHIMENTO AUTOMÁTICO)

**Estado Atual**: ${currentState}
**Missão do Estado**: ${missionPrompt}
**CHAVE_DE_VALIDACAO_DO_ESTADO**: "${dataKey}"

**DADOS_JÁ_COLETADOS**:
\`\`\`json
${JSON.stringify(extractedData, null, 2)}
\`\`\`

**ÚLTIMA MENSAGEM DO CLIENTE**: "${lastMessage}"

**HISTÓRICO DA CONVERSA**:
${conversationHistory.slice(-10).map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`).join('\n')}

**OPÇÕES DE ROTA DISPONÍVEIS**:
\`\`\`json
${JSON.stringify(availableRoutes, null, 2)}
\`\`\`

${prohibitions ? `**PROIBIÇÕES DO ESTADO ATUAL**:\n${prohibitions}\n` : ''}

## EXECUTE O MOTOR DE DECISÃO AGORA
Retorne APENAS o objeto JSON conforme LEI UM.`;
}

// ==================== IA 3: DECISION VALIDATOR ====================

export function buildDecisionValidatorPrompt(
  input: ValidationInput,
  customPrompt?: string | null
): string {
  const { currentState, proposedNextState, decision, extractedData, conversationHistory, stateInfo, agentContext } = input;

  const basePrompt = customPrompt || VALIDATOR_SYSTEM_PROMPT;

  return `${basePrompt}

# CONTEXTO DO AGENTE

**Nome do Agente**: ${agentContext.name}
${agentContext.personality ? `**Personalidade**: ${agentContext.personality}` : ''}
${agentContext.tone ? `**Tom de Voz**: ${agentContext.tone}` : ''}
${agentContext.prohibitions ? `**PROIBIÇÕES GLOBAIS DO AGENTE**: ${agentContext.prohibitions}` : ''}

# EVIDÊNCIAS DO CASO (CONTEXTO REAL)

## 1. O CENÁRIO
**Estado Atual**: ${currentState}
**Estado Proposto pelo Réu**: ${proposedNextState}
**Missão do Estado**: ${stateInfo.missionPrompt}
**Data Key**: ${stateInfo.dataKey || 'vazio'}
**Proibições do Estado**: ${stateInfo.prohibitions || 'Nenhuma'}

## 2. A DECISÃO DO RÉU
**Veredito**: ${decision.veredito || 'N/A'}
**Rota Escolhida**: ${decision.rota_escolhida || 'N/A'}
**Confiança**: ${decision.confianca || 'N/A'}
**Raciocínio**: 
${Array.isArray(decision.pensamento) ? decision.pensamento.join('\n') : decision.pensamento}

## 3. AS PROVAS (DADOS E HISTÓRICO)
**Dados Extraídos**:
\`\`\`json
${JSON.stringify(extractedData, null, 2)}
\`\`\`

**Histórico da Conversa**:
${conversationHistory.slice(-10).map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`).join('\n')}

## 4. AS LEIS LOCAIS (ROTAS VÁLIDAS)
\`\`\`json
${JSON.stringify(stateInfo.availableRoutes, null, 2)}
\`\`\`

EXECUTE O JULGAMENTO AGORA. RETORNE APENAS O JSON.`;
}
