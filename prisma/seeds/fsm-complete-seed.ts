import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed completo baseado nos casos de SUCESSO e DESCARTE
 * 
 * Fluxo da Matriz FSM:
 * INICIO → VALOR_DIVIDA → BANCO_LEAD/DESCARTE → MODALIDADE_DIV → ATRASO_DIV → 
 * FICAR_ATRASO → EXPLICAR_METODO → GARANTIA_DIV → OFERTA_REUNIAO → 
 * AGENDAMENTO_INICIAR_E_SUGERIR → AGENDAMENTO_CONFIRMAR_E_CRIAR → AGENDAMENTO_CONFIRMADO
 */

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Buscar organização e agente existentes
    const organization = await prisma.organization.findFirst();
    if (!organization) {
        throw new Error('Nenhuma organização encontrada. Crie uma organização primeiro.');
    }

    const agent = await prisma.agent.findFirst({
        where: { organizationId: organization.id },
    });
    if (!agent) {
        throw new Error('Nenhum agente encontrado. Crie um agente primeiro.');
    }

    console.log(`📍 Organização: ${organization.name}`);
    console.log(`🤖 Agente: ${agent.name}`);

    // Limpar dados existentes
    console.log('🧹 Limpando estados e matriz existentes...');
    await prisma.state.deleteMany({
        where: { agentId: agent.id },
    });
    await prisma.matrixItem.deleteMany({
        where: { agentId: agent.id },
    });

    // ============================================================================
    // ESTADOS FSM
    // ============================================================================
    console.log('📊 Criando estados FSM...');

    const states = [
        // 1. INICIO - Coleta nome do cliente
        {
            name: 'INICIO',
            order: 1,
            missionPrompt: 'Coletar o primeiro nome do cliente de forma natural e amigável.',
            dataKey: 'nome_cliente',
            dataType: 'string',
            dataDescription: 'Primeiro nome do cliente',
            availableRoutes: {
                rota_de_sucesso: [
                    {
                        estado: 'VALOR_DIVIDA',
                        descricao: 'O cliente informou seu nome.',
                    },
                ],
                rota_de_persistencia: [
                    {
                        estado: 'INICIO',
                        descricao: 'Cliente não informou o nome, insistir.',
                    },
                ],
                rota_de_escape: [],
            },
            prohibitions: 'Não prossiga sem obter o nome do cliente.',
            tools: null,
        },

        // 2. VALOR_DIVIDA - Coleta valor da dívida
        {
            name: 'VALOR_DIVIDA',
            order: 2,
            missionPrompt: 'Perguntar o valor total da dívida do cliente. Valores ambíguos como 400, 50 ou 250 devem ser tratados com cautela.',
            dataKey: 'valor_divida',
            dataType: 'number',
            dataDescription: 'Valor total da dívida em reais',
            availableRoutes: {
                rota_de_sucesso: [
                    {
                        estado: 'BANCO_LEAD',
                        descricao: 'Dívida igual ou superior a 60 mil reais.',
                    },
                    {
                        estado: 'DESCARTE',
                        descricao: 'Dívida abaixo de 59 mil reais.',
                    },
                ],
                rota_de_persistencia: [
                    {
                        estado: 'VALOR_DIVIDA',
                        descricao: 'Cliente não informou valor válido, insistir.',
                    },
                ],
                rota_de_escape: [],
            },
            prohibitions: 'Não aceite valores ambíguos sem confirmação.',
            tools: null,
        },

        // 3. BANCO_LEAD - Identifica o banco da dívida
        {
            name: 'BANCO_LEAD',
            order: 3,
            missionPrompt: 'Identificar qual banco possui a dívida. Bancos aceitos: Itaú, Bradesco, Santander, Banco do Brasil, Caixa.',
            dataKey: 'divida_banco',
            dataType: 'string',
            dataDescription: 'Nome do banco onde está a dívida',
            availableRoutes: {
                rota_de_sucesso: [
                    {
                        estado: 'MODALIDADE_DIV',
                        descricao: 'Cliente mencionou um único banco da lista permitida.',
                    },
                    {
                        estado: 'MULTIPLOS_BANCOS',
                        descricao: 'Cliente mencionou múltiplos bancos.',
                    },
                    {
                        estado: 'DESCARTE',
                        descricao: 'Banco mencionado não está na lista permitida.',
                    },
                ],
                rota_de_persistencia: [
                    {
                        estado: 'BANCO_LEAD',
                        descricao: 'Cliente não informou banco, insistir.',
                    },
                ],
                rota_de_escape: [],
            },
            prohibitions: 'Não aceite bancos fora da lista permitida.',
            tools: null,
        },

        // 4. MODALIDADE_DIV - Tipo de crédito
        {
            name: 'MODALIDADE_DIV',
            order: 4,
            missionPrompt: 'Perguntar qual o tipo de crédito: cartão de crédito, empréstimo pessoal, capital de giro, financiamento, etc. Cheque especial sozinho não é aceito.',
            dataKey: 'modalidades_credito',
            dataType: 'string',
            dataDescription: 'Tipo de modalidade de crédito',
            availableRoutes: {
                rota_de_sucesso: [
                    {
                        estado: 'ATRASO_DIV',
                        descricao: 'Cliente informou modalidade válida (não apenas cheque especial).',
                    },
                    {
                        estado: 'DESCARTE',
                        descricao: 'Cliente informou apenas cheque especial.',
                    },
                ],
                rota_de_persistencia: [
                    {
                        estado: 'MODALIDADE_DIV',
                        descricao: 'Cliente não informou modalidade, insistir.',
                    },
                ],
                rota_de_escape: [],
            },
            prohibitions: 'Não aceite apenas cheque especial como modalidade.',
            tools: null,
        },

        // 5. ATRASO_DIV - Verifica se está em atraso
        {
            name: 'ATRASO_DIV',
            order: 5,
            missionPrompt: 'Confirmar se a dívida já está em atraso e há quanto tempo.',
            dataKey: 'atraso',
            dataType: 'string',
            dataDescription: 'Status de atraso da dívida',
            availableRoutes: {
                rota_de_sucesso: [
                    {
                        estado: 'GARANTIA_DIV',
                        descricao: 'Cliente confirmou que está em atraso.',
                    },
                    {
                        estado: 'FICAR_ATRASO',
                        descricao: 'Cliente informou que não está em atraso.',
                    },
                ],
                rota_de_persistencia: [
                    {
                        estado: 'ATRASO_DIV',
                        descricao: 'Cliente não respondeu claramente, insistir.',
                    },
                ],
                rota_de_escape: [],
            },
            prohibitions: null,
            tools: null,
        },

        // 6. FICAR_ATRASO - Explica dinâmica de negociação
        {
            name: 'FICAR_ATRASO',
            order: 6,
            missionPrompt: 'Explicar que bancos só negociam quando há atraso e perguntar se o cliente conseguirá manter os pagamentos em dia.',
            dataKey: 'atraso_decorrer_tempo',
            dataType: 'string',
            dataDescription: 'Se o cliente vai conseguir manter pagamentos',
            availableRoutes: {
                rota_de_sucesso: [
                    {
                        estado: 'EXPLICAR_METODO',
                        descricao: 'Cliente informa que vai manter o pagamento das parcelas em dia, ou fala que não vai atrasar.',
                    },
                    {
                        estado: 'GARANTIA_DIV',
                        descricao: 'Cliente indica que pode ficar em atraso ou não consegue manter pagamentos.',
                    },
                ],
                rota_de_persistencia: [
                    {
                        estado: 'FICAR_ATRASO',
                        descricao: 'Cliente não respondeu claramente.',
                    },
                ],
                rota_de_escape: [
                    {
                        estado: 'DESCARTE',
                        descricao: 'Cliente não tem interesse.',
                    },
                ],
            },
            prohibitions: null,
            tools: null,
        },

        // 7. EXPLICAR_METODO - Explica método de negociação
        {
            name: 'EXPLICAR_METODO',
            order: 7,
            missionPrompt: 'Explicar o mecanismo de negociação estratégica com bancos e verificar se faz sentido para o cliente.',
            dataKey: 'abertura_atraso',
            dataType: 'string',
            dataDescription: 'Se o cliente está aberto ao método',
            availableRoutes: {
                rota_de_sucesso: [
                    {
                        estado: 'GARANTIA_DIV',
                        descricao: 'Cliente demonstra abertura e entendimento do método.',
                    },
                ],
                rota_de_persistencia: [
                    {
                        estado: 'EXPLICAR_METODO',
                        descricao: 'Cliente não entendeu ou não respondeu.',
                    },
                ],
                rota_de_escape: [
                    {
                        estado: 'DESCARTE',
                        descricao: 'Cliente não tem interesse no método.',
                    },
                ],
            },
            prohibitions: null,
            tools: null,
        },

        // 8. GARANTIA_DIV - Verifica garantias
        {
            name: 'GARANTIA_DIV',
            order: 8,
            missionPrompt: 'Perguntar se a dívida possui garantias como imóvel, veículo ou fiador.',
            dataKey: 'garantia',
            dataType: 'string',
            dataDescription: 'Tipo de garantia vinculada à dívida',
            availableRoutes: {
                rota_de_sucesso: [
                    {
                        estado: 'OFERTA_REUNIAO',
                        descricao: 'Cliente informou sobre garantias (sim ou não).',
                    },
                ],
                rota_de_persistencia: [
                    {
                        estado: 'GARANTIA_DIV',
                        descricao: 'Cliente não respondeu claramente.',
                    },
                ],
                rota_de_escape: [],
            },
            prohibitions: null,
            tools: null,
        },

        // 9. OFERTA_REUNIAO - Oferece reunião
        {
            name: 'OFERTA_REUNIAO',
            order: 9,
            missionPrompt: 'Oferecer reunião gratuita online com advogada especialista e perguntar preferência de período (manhã ou tarde).',
            dataKey: 'interesse_reunião',
            dataType: 'string',
            dataDescription: 'Interesse do cliente em reunião',
            availableRoutes: {
                rota_de_sucesso: [
                    {
                        estado: 'AGENDAMENTO_INICIAR_E_SUGERIR',
                        descricao: 'Cliente demonstra interesse e sugere período (manhã/tarde).',
                    },
                    {
                        estado: 'AGENDAMENTO_VERIFICAR_DISPONIBILIDADE',
                        descricao: 'Cliente sugere dia e horário específico.',
                    },
                ],
                rota_de_persistencia: [
                    {
                        estado: 'OFERTA_REUNIAO',
                        descricao: 'Cliente não respondeu claramente.',
                    },
                ],
                rota_de_escape: [
                    {
                        estado: 'DESCARTE',
                        descricao: 'Cliente não tem interesse em reunião.',
                    },
                ],
            },
            prohibitions: null,
            tools: null,
        },

        // 10. AGENDAMENTO_INICIAR_E_SUGERIR - Sugere horários
        {
            name: 'AGENDAMENTO_INICIAR_E_SUGERIR',
            order: 10,
            missionPrompt: 'Sugerir 2 horários específicos disponíveis baseado na preferência do cliente.',
            dataKey: 'horario_escolhido',
            dataType: 'string',
            dataDescription: 'Horário escolhido pelo cliente',
            availableRoutes: {
                rota_de_sucesso: [
                    {
                        estado: 'AGENDAMENTO_CONFIRMAR_E_CRIAR',
                        descricao: 'Cliente aceita um dos horários sugeridos.',
                    },
                    {
                        estado: 'AGENDAMENTO_VERIFICAR_DISPONIBILIDADE',
                        descricao: 'Cliente sugere outro horário específico.',
                    },
                ],
                rota_de_persistencia: [
                    {
                        estado: 'AGENDAMENTO_INICIAR_E_SUGERIR',
                        descricao: 'Cliente não escolheu horário, reoferecer.',
                    },
                ],
                rota_de_escape: [
                    {
                        estado: 'DESCARTE',
                        descricao: 'Cliente desistiu do agendamento.',
                    },
                ],
            },
            prohibitions: 'Não aceite respostas vagas como apenas "manhã" sem horário específico.',
            tools: 'check_calendar_availability',
        },

        // 11. AGENDAMENTO_VERIFICAR_DISPONIBILIDADE - Verifica disponibilidade
        {
            name: 'AGENDAMENTO_VERIFICAR_DISPONIBILIDADE',
            order: 11,
            missionPrompt: 'Verificar se o horário sugerido pelo cliente está disponível na agenda.',
            dataKey: 'horario_disponivel',
            dataType: 'boolean',
            dataDescription: 'Se o horário está disponível',
            availableRoutes: {
                rota_de_sucesso: [
                    {
                        estado: 'AGENDAMENTO_CONFIRMAR_E_CRIAR',
                        descricao: 'Horário está disponível.',
                    },
                ],
                rota_de_persistencia: [
                    {
                        estado: 'AGENDAMENTO_INICIAR_E_SUGERIR',
                        descricao: 'Horário não disponível, sugerir outros.',
                    },
                ],
                rota_de_escape: [],
            },
            prohibitions: null,
            tools: 'check_calendar_availability',
        },

        // 12. AGENDAMENTO_CONFIRMAR_E_CRIAR - Confirma e cria agendamento
        {
            name: 'AGENDAMENTO_CONFIRMAR_E_CRIAR',
            order: 12,
            missionPrompt: 'Confirmar o agendamento e criar na agenda. IMPORTANTE: Na primeira vez nesta rota, SEMPRE escolha rota_de_persistencia para confirmar com o cliente antes de finalizar.',
            dataKey: 'agendamento_confirmado',
            dataType: 'boolean',
            dataDescription: 'Se o agendamento foi confirmado',
            availableRoutes: {
                rota_de_sucesso: [
                    {
                        estado: 'AGENDAMENTO_CONFIRMADO',
                        descricao: 'Agendamento criado e confirmado com sucesso.',
                    },
                ],
                rota_de_persistencia: [
                    {
                        estado: 'AGENDAMENTO_CONFIRMAR_E_CRIAR',
                        descricao: 'Aguardando confirmação final do cliente.',
                    },
                ],
                rota_de_escape: [
                    {
                        estado: 'AGENDAMENTO_INICIAR_E_SUGERIR',
                        descricao: 'Cliente mudou de ideia sobre o horário.',
                    },
                ],
            },
            prohibitions: 'PASSO 2 DESATIVADO na primeira execução. Sempre use rota_de_persistencia na primeira vez.',
            tools: 'create_appointment',
        },

        // 13. AGENDAMENTO_CONFIRMADO - Estado final de sucesso
        {
            name: 'AGENDAMENTO_CONFIRMADO',
            order: 13,
            missionPrompt: 'Agendamento confirmado. Agradecer e informar que a equipe entrará em contato.',
            dataKey: 'vazio',
            dataType: 'string',
            dataDescription: 'Estado final',
            availableRoutes: {
                rota_de_sucesso: [],
                rota_de_persistencia: [
                    {
                        estado: 'AGENDAMENTO_CONFIRMADO',
                        descricao: 'Manter no estado final.',
                    },
                ],
                rota_de_escape: [],
            },
            prohibitions: null,
            tools: null,
        },

        // 14. DESCARTE - Estado final de descarte
        {
            name: 'DESCARTE',
            order: 14,
            missionPrompt: 'Encerrar o atendimento de maneira cordial quando o cliente não se qualifica para as soluções do escritório.',
            dataKey: 'Desqualificou',
            dataType: 'string',
            dataDescription: 'Motivo da desqualificação',
            availableRoutes: {
                rota_de_sucesso: [],
                rota_de_persistencia: [
                    {
                        estado: 'DESCARTE',
                        descricao: 'Manter no estado de descarte.',
                    },
                ],
                rota_de_escape: [],
            },
            prohibitions: null,
            tools: null,
        },

        // 15. MULTIPLOS_BANCOS - Trata múltiplos bancos
        {
            name: 'MULTIPLOS_BANCOS',
            order: 15,
            missionPrompt: 'Cliente tem dívidas em múltiplos bancos. Perguntar qual banco tem a maior dívida.',
            dataKey: 'banco_principal',
            dataType: 'string',
            dataDescription: 'Banco com maior dívida',
            availableRoutes: {
                rota_de_sucesso: [
                    {
                        estado: 'MODALIDADE_DIV',
                        descricao: 'Cliente informou o banco principal.',
                    },
                ],
                rota_de_persistencia: [
                    {
                        estado: 'MULTIPLOS_BANCOS',
                        descricao: 'Cliente não informou banco principal.',
                    },
                ],
                rota_de_escape: [],
            },
            prohibitions: null,
            tools: null,
        },
    ];

    for (const stateData of states) {
        await prisma.state.create({
            data: {
                ...stateData,
                agentId: agent.id,
                organizationId: organization.id,
            },
        });
    }

    console.log(`✅ ${states.length} estados criados com sucesso!`);

    // ============================================================================
    // MATRIZ DE INSTRUÇÕES
    // ============================================================================
    console.log('📝 Criando itens da matriz...');

    const matrixItems = [
        {
            category: 'QUALIFICACAO',
            title: 'Dívida acima de 60 mil',
            description: 'Cliente qualificado por valor de dívida >= 60k',
            response: 'Cliente qualificado por valor de dívida. Prosseguir com qualificação.',
            personality: 'Empática e profissional',
            prohibitions: 'Não descartar leads com dívida >= 60k',
            data: '',
            dataExtraction: '',
            matrixFlow: '',
            scheduling: '',
            writing: '',
            priority: 1,
        },
        {
            category: 'DESQUALIFICACAO',
            title: 'Dívida abaixo de 60 mil',
            description: 'Cliente desqualificado por valor de dívida < 60k',
            response: 'Infelizmente, neste momento, nosso escritório não consegue oferecer uma solução personalizada para casos com dívida abaixo de 59 mil reais. Agradeço muito por ter confiado e compartilhado sua situação comigo.',
            personality: 'Cordial e empática',
            prohibitions: 'Não oferecer serviços para dívidas < 60k',
            data: '',
            dataExtraction: '',
            matrixFlow: '',
            scheduling: '',
            writing: '',
            priority: 1,
        },
        {
            category: 'DESQUALIFICACAO',
            title: 'Apenas cheque especial',
            description: 'Cliente desqualificado por ter apenas cheque especial',
            response: 'Infelizmente, neste momento, nosso escritório não consegue oferecer uma solução personalizada para casos somente de cheque especial. Caso tenha qualquer outra dúvida sobre direitos bancários, pode me chamar.',
            personality: 'Cordial e empática',
            prohibitions: 'Não aceitar apenas cheque especial',
            data: '',
            dataExtraction: '',
            matrixFlow: '',
            scheduling: '',
            writing: '',
            priority: 1,
        },
        {
            category: 'EDUCACAO',
            title: 'Explicar dinâmica de negociação',
            description: 'Explicação sobre como bancos negociam dívidas',
            response: 'Quando a dívida está em dia, o banco normalmente não tem interesse em renegociar ou dar descontos, porque ele não está sob risco de prejuízo. É só quando existe o atraso que o banco passa a enxergar a possibilidade de perda — e aí sim ele se mostra mais aberto a negociar valores e condições.',
            personality: 'Educativa e consultiva',
            prohibitions: 'Não prometer resultados garantidos',
            data: '',
            dataExtraction: '',
            matrixFlow: '',
            scheduling: '',
            writing: '',
            priority: 1,
        },
        {
            category: 'AGENDAMENTO',
            title: 'Oferta de reunião',
            description: 'Oferecer reunião gratuita com advogada especialista',
            response: 'O próximo passo é uma reunião gratuita e online com uma advogada especialista em passivos bancários, onde vamos analisar seu caso e te apresentar estratégias feitas sob medida, sem compromisso inicial.',
            personality: 'Profissional e acolhedora',
            prohibitions: 'Não cobrar pela reunião inicial',
            data: '',
            dataExtraction: '',
            matrixFlow: '',
            scheduling: '',
            writing: '',
            priority: 1,
        },
    ];

    for (const itemData of matrixItems) {
        await prisma.matrixItem.create({
            data: {
                ...itemData,
                agentId: agent.id,
                organizationId: organization.id,
            },
        });
    }

    console.log(`✅ ${matrixItems.length} itens da matriz criados com sucesso!`);
    console.log('🎉 Seed concluído com sucesso!');
}

main()
    .catch((e) => {
        console.error('❌ Erro durante seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
