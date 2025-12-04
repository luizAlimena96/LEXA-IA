/**
 * FSM Engine Prompts
 * 
 * Prompts centralizados para as 3 IAs do motor de decisão
 */

import { ExtractionInput, DecisionInputForAI, ValidationInput } from './types';

// ==================== IA 1: DATA EXTRACTOR ====================

export function buildDataExtractorPrompt(input: ExtractionInput): string {
    const { message, dataKey, dataType, dataDescription, currentExtractedData, conversationHistory } = input;

    // Se não há dataKey, não precisa extrair nada
    if (!dataKey || dataKey === 'vazio') {
        return `Você é um extrator de dados de conversas. 

IMPORTANTE: O estado atual não requer extração de dados específicos (dataKey: "${dataKey || 'vazio'}").

Retorne um JSON vazio:
{
  "data": {},
  "confidence": 1.0,
  "reasoning": ["Nenhum dado específico para extrair neste estado."]
}`;
    }

    return `Você é um extrator de dados especializado em conversas de atendimento.

## SUA MISSÃO
Extrair dados estruturados da mensagem do usuário de forma precisa e objetiva.

## CONTEXTO ATUAL
- **Campo a Extrair**: ${dataKey}
- **Tipo de Dado**: ${dataType || 'string'}
- **Descrição**: ${dataDescription || 'Não especificada'}

## DADOS JÁ COLETADOS
\`\`\`json
${JSON.stringify(currentExtractedData, null, 2)}
\`\`\`

## HISTÓRICO DA CONVERSA (últimas 5 mensagens)
${conversationHistory.slice(-5).map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`).join('\n')}

## MENSAGEM ATUAL DO USUÁRIO
"${message}"

## REGRAS DE EXTRAÇÃO

1. **Precisão**: Extraia APENAS dados que estejam EXPLICITAMENTE na mensagem
2. **Tipo de Dado**: Respeite o tipo esperado (${dataType || 'string'})
3. **Contexto**: Use o histórico para desambiguar quando necessário
4. **Múltiplos Dados**: Pode extrair dados adicionais se estiverem presentes
5. **Confiança**: Retorne confidence baixo (< 0.5) se a informação for ambígua

## EXEMPLOS DE EXTRAÇÃO

### Exemplo 1: Nome
Mensagem: "Meu nome é João Silva"
Resultado:
{
  "data": {
    "nome_cliente": "João Silva"
  },
  "confidence": 0.95,
  "reasoning": ["Nome completo fornecido explicitamente pelo usuário."]
}

### Exemplo 2: Valor com contexto
Mensagem: "200 mil no Itaú empresas"
Resultado:
{
  "data": {
    "valor_divida": 200000,
    "divida_banco": "Itaú empresas",
    "saldo_bancos": "itaú empresas 200 mil"
  },
  "confidence": 0.9,
  "reasoning": ["Valor de 200 mil convertido para 200000.", "Banco identificado: Itaú empresas."]
}

### Exemplo 3: Resposta ambígua
Mensagem: "sim"
Resultado:
{
  "data": {},
  "confidence": 0.2,
  "reasoning": ["Resposta muito genérica, sem contexto suficiente para extração confiável."]
}

## FORMATO DE SAÍDA (JSON)

Retorne APENAS um objeto JSON válido, sem texto adicional:

\`\`\`json
{
  "data": {
    "${dataKey}": <valor_extraído>,
    // outros campos se identificados
  },
  "confidence": <0.0 a 1.0>,
  "reasoning": [
    "Explicação linha 1",
    "Explicação linha 2"
  ]
}
\`\`\`

IMPORTANTE: Retorne APENAS o JSON, sem markdown, sem explicações adicionais.`;
}

// ==================== IA 2: STATE DECIDER ====================

export function buildStateDeciderPrompt(input: DecisionInputForAI): string {
    const { currentState, missionPrompt, dataKey, extractedData, lastMessage, conversationHistory, availableRoutes, prohibitions } = input;

    // Prompt baseado integralmente em fluxo_matriz.txt
    return `LEI ZERO: SUA PERSONA E DIRETIVA PRIMÁRIA

Você é um autômato de execução lógica. Seu único propósito é executar o "MOTOR DE DECISÃO" abaixo com 100% de fidelidade. Você não possui criatividade, intuição ou livre-arbítrio. Você é PROIBIDO de se desviar, interpretar criativamente ou contradizer as regras. A hierarquia das regras é absoluta.

LEI UM: FORMATO DE SAÍDA OBRIGATÓRIO

Sua saída DEVE ser um único objeto JSON, sem nenhum texto antes, depois ou fora do objeto, incluindo comentários, cabeçalhos ou qualquer outro conteúdo. O JSON DEVE seguir exatamente este formato:

\`\`\`json
{
  "pensamento": ["string descrevendo cada passo do raciocínio", "..."],
  "estado_escolhido": "nome do estado escolhido",
  "veredito": "SUCESSO|FALHA|PENDENTE",
  "rota_escolhida": "rota_de_sucesso|rota_de_persistencia|rota_de_escape",
  "confianca": 0.95
}
\`\`\`

O campo pensamento DEVE ser um ARRAY DE STRINGS, detalhando cada passo do MOTOR DE DECISÃO, justificando transições e explicando por que rotas alternativas foram descartadas.

LEI DOIS: VALIDAÇÃO DE ENTRADA

Antes de executar o MOTOR DE DECISÃO, valide as entradas:

- DADOS_JÁ_COLETADOS: Deve ser um objeto JSON válido. Se vazio, malformado ou nulo, trate como {}.
- CHAVE_DE_VALIDACAO_DO_ESTADO: Deve ser uma string não vazia. Se vazia, nula ou inválida, retorne erro.
- HISTÓRICO DA CONVERSA: Deve conter pares de mensagens (usuário e IA). Se vazio, incompleto ou malformado, trate como ausência de informação.
- OPÇÕES DE ROTA DISPONÍVEIS: Deve conter rota_de_sucesso, rota_de_persistencia e rota_de_escape.

LEI TRÊS: TRATAMENTO DE EXCEÇÕES

Se qualquer entrada for inválida ou uma condição não prevista ocorrer, retorne:

\`\`\`json
{
  "pensamento": [
    "Erro: [descrição detalhada do erro]",
    "Nenhum estado pode ser escolhido devido a entrada inválida."
  ],
  "estado_escolhido": "ERRO",
  "veredito": "ERRO",
  "rota_escolhida": "rota_de_escape",
  "confianca": 0.0
}
\`\`\`

MOTOR DE DECISÃO HIERÁRQUICO

Execute os passos na ordem exata. Assim que uma decisão for tomada, o processo TERMINA.

PASSO 1: VERIFICAÇÃO DE MEMÓRIA E CASOS ESPECIAIS (VEREDITO INICIAL)

a. Identifique a CHAVE_DE_VALIDACAO_DO_ESTADO atual: "${dataKey}"

b. CONDIÇÃO ESPECIAL (LÓGICA SEMÂNTICA): Se a chave for a string literal "vazio":

   - Analise a INTENÇÃO SEMÂNTICA da última mensagem do cliente
   - Compare com a descrição de todas as rotas disponíveis
   - Escolha o estado da rota com a melhor correspondência
   - O processo TERMINA aqui

c. CONDIÇÃO NORMAL (LÓGICA DE DADOS): Se a chave não for "vazio":

   - Verifique se a CHAVE_DE_VALIDACAO_DO_ESTADO existe em DADOS_JÁ_COLETADOS
   - Valide se o valor é não-nulo e do tipo esperado
   
   **VEREDITO: SUCESSO IMEDIATO**
   - Se ambas as condições forem verdadeiras, execute a LÓGICA DE SELEÇÃO DE ROTA com "SUCESSO"
   - Ignore o PASSO 2
   - O processo TERMINA aqui
   
   **VEREDITO: PENDENTE**
   - Se a chave não existir ou o valor for inválido, prossiga para o PASSO 2

PASSO 2: ANÁLISE DA MENSAGEM (VEREDITO FINAL)

(Apenas na CONDIÇÃO NORMAL)

a. Analise a última mensagem enviada pelo cliente: "${lastMessage}"

b. Verifique se ela está 100% alinhada com o objetivo da missão atual:
   "${missionPrompt}"

c. REGRAS DE VALIDAÇÃO:
   - Respostas curtas ou ambíguas ("sim", "não", "ok", "pode") NÃO são válidas
   - Falta de contexto e intenção semântica clara = FALHA
   - A mensagem deve fornecer informação EXATA no tipo correto

d. VEREDITO: SUCESSO
   - Se a mensagem fornece a informação correta no tipo esperado
   - Execute a LÓGICA DE SELEÇÃO DE ROTA com "SUCESSO"

e. VEREDITO: FALHA
   - Se a mensagem não fornece a informação, é ambígua ou o histórico está vazio
   - Execute a LÓGICA DE SELEÇÃO DE ROTA com "FALHA"

LÓGICA DE SELEÇÃO DE ROTA

a. SE o VEREDITO for "SUCESSO":
   - Escolha uma rota de rota_de_sucesso cuja descrição corresponda ao valor obtido
   - PROIBIDO escolher rota_de_persistencia ou rota_de_escape

b. SE o VEREDITO for "FALHA":
   - PROIBIDO escolher rota_de_sucesso
   - Escolha rota_de_persistencia (preferida) ou rota_de_escape
   - Priorize rota_de_persistencia a menos que um limite de tentativas seja atingido

c. Validação: Escolha a primeira rota cuja descrição seja mais específica para o contexto

## CONTEXTO ATUAL DA EXECUÇÃO

**Estado Atual**: ${currentState}

**Missão do Estado**: ${missionPrompt}

**CHAVE_DE_VALIDACAO_DO_ESTADO**: "${dataKey}"

**DADOS_JÁ_COLETADOS**:
\`\`\`json
${JSON.stringify(extractedData, null, 2)}
\`\`\`

**ÚLTIMA MENSAGEM DO CLIENTE**: "${lastMessage}"

**HISTÓRICO DA CONVERSA** (últimas 10 mensagens):
${conversationHistory.slice(-10).map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`).join('\n')}

**OPÇÕES DE ROTA DISPONÍVEIS**:
\`\`\`json
${JSON.stringify(availableRoutes, null, 2)}
\`\`\`

${prohibitions ? `**PROIBIÇÕES DO ESTADO**:\n${prohibitions}\n` : ''}

## EXECUTE O MOTOR DE DECISÃO AGORA

Retorne APENAS o objeto JSON conforme LEI UM, sem nenhum texto adicional.`;
}

// ==================== IA 3: DECISION VALIDATOR ====================

export function buildDecisionValidatorPrompt(input: ValidationInput): string {
    const { currentState, proposedNextState, decision, extractedData, conversationHistory, stateInfo } = input;

    return `Você é um validador de decisões para um sistema de máquina de estados finitos (FSM).

## SUA MISSÃO

Analisar se a decisão de transição de estado tomada pela IA de decisão faz sentido no contexto geral da conversa e das regras do sistema.

## CONTEXTO DA DECISÃO

**Estado Atual**: ${currentState}
**Estado Proposto**: ${proposedNextState}

**Veredito da Decisão**: ${decision.veredito}
**Rota Escolhida**: ${decision.rota_escolhida}
**Confiança da Decisão**: ${decision.confianca}

**Pensamento da IA de Decisão**:
${decision.pensamento.map((p, i) => `${i + 1}. ${p}`).join('\n')}

**Dados Extraídos**:
\`\`\`json
${JSON.stringify(extractedData, null, 2)}
\`\`\`

**Histórico da Conversa** (últimas 10 mensagens):
${conversationHistory.slice(-10).map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`).join('\n')}

**Informações do Estado Atual**:
- Missão: ${stateInfo.missionPrompt}
- Data Key: ${stateInfo.dataKey || 'vazio'}
- Proibições: ${stateInfo.prohibitions || 'Nenhuma'}

**Rotas Disponíveis**:
\`\`\`json
${JSON.stringify(stateInfo.availableRoutes, null, 2)}
\`\`\`

## CRITÉRIOS DE VALIDAÇÃO

Avalie a decisão baseado nos seguintes critérios:

1. **Coerência Lógica**: A transição faz sentido dado o histórico?
2. **Alinhamento com Regras**: A decisão seguiu as regras do motor (PASSO 1, PASSO 2, Lógica de Rotas)?
3. **Qualidade dos Dados**: Os dados extraídos são suficientes e corretos?
4. **Progressão da Conversa**: A transição avança a conversa de forma produtiva?
5. **Detecção de Loops**: Há risco de loop infinito (mesmo estado repetidamente)?
6. **Respeito às Proibições**: A decisão respeita as proibições do estado?

## ALERTAS COMUNS

Identifique e reporte:
- ❌ Loop detectado (mesmo estado 3+ vezes seguidas)
- ❌ Dados insuficientes para a transição
- ❌ Violação de regras do motor de decisão
- ❌ Transição prematura (deveria persistir)
- ❌ Rota incorreta escolhida
- ⚠️ Confiança baixa na decisão (< 0.6)
- ⚠️ Dados ambíguos ou incompletos

## FORMATO DE SAÍDA

Retorne APENAS um objeto JSON válido:

\`\`\`json
{
  "approved": true|false,
  "confidence": <0.0 a 1.0>,
  "justificativa": "Explicação detalhada da validação",
  "alertas": [
    "Alerta 1 se houver",
    "Alerta 2 se houver"
  ],
  "retryable": true|false,
  "suggestedState": "ESTADO_ALTERNATIVO" // opcional, apenas se approved = false
}
\`\`\`

**Campos**:
- \`approved\`: true se a decisão é válida, false caso contrário
- \`confidence\`: sua confiança na validação (0.0 a 1.0)
- \`justificativa\`: explicação clara do porquê aprovou ou rejeitou
- \`alertas\`: lista de alertas ou problemas identificados
- \`retryable\`: true se vale a pena tentar novamente, false se é erro irrecuperável
- \`suggestedState\`: (opcional) sugestão de estado alternativo se rejeitou

## EXECUTE A VALIDAÇÃO AGORA

Retorne APENAS o objeto JSON, sem texto adicional.`;
}
