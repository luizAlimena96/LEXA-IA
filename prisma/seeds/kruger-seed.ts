import { PrismaClient, LeadStatus, UserRole, Tone } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { fsmRoutes } from './fsm-routes';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed para organização KRUGER...');

    // Criar super admin
    const user = await prisma.user.upsert({
        where: { email: 'admin@lexa.com' },
        update: {},
        create: {
            email: 'admin@lexa.com',
            name: 'Super Admin',
            password: await bcrypt.hash('admin123', 10),
            role: UserRole.SUPER_ADMIN,
        },
    });
    console.log(`✅ Super admin: ${user.email}`);

    // Criar organização KRUGER
    const organization = await prisma.organization.upsert({
        where: { slug: 'kruger' },
        update: {
            name: 'KRUGER',
            niche: 'Consultoria Jurídica - Passivos Bancários',
        },
        create: {
            name: 'KRUGER',
            slug: 'kruger',
            email: 'contato@kruger.com.br',
            phone: '5511999999999',
            evolutionInstanceName: 'kruger',
            openaiModel: 'gpt-4o-mini',
            niche: 'Consultoria Jurídica - Passivos Bancários',
        },
    });
    console.log(`✅ Organização: ${organization.name}`);

    // Criar agente
    const agent = await prisma.agent.upsert({
        where: { instance: 'kruger' },
        update: {
            name: 'Assistente KRUGER',
            personality: `Você é uma assistente virtual empática e profissional da KRUGER, escritório especializado em consultoria jurídica para passivos bancários.

Características:
- Empática e acolhedora com clientes em dificuldades financeiras
- Profissional e consultiva, sem ser intimidadora
- Educativa, explicando conceitos de forma clara
- Objetiva na coleta de informações
- Paciente e persistente, mas respeitosa`,

            systemPrompt: 'Qualifique leads para consultoria jurídica em passivos bancários. Critérios: dívida >= 60k, bancos principais (Itaú, Bradesco, Santander, BB, Caixa), não apenas cheque especial.',

            fsmDataExtractorPrompt: `Você é um extrator de dados especializado. Analise a mensagem do cliente e extraia APENAS os dados solicitados para o estado atual.

Regras:
1. Retorne APENAS o dado solicitado, sem informações extras
2. Se o dado não estiver presente, retorne null
3. Normalize os dados (ex: "sessenta mil" → 60000)
4. Para valores monetários, retorne apenas números
5. Para nomes, retorne apenas o primeiro nome
6. Para bancos, normalize o nome (ex: "itau" → "Itaú")`,

            fsmStateDeciderPrompt: `Você é um decisor de estados FSM. Analise a mensagem do cliente e os dados extraídos para decidir qual rota seguir.

Regras:
1. Siga ESTRITAMENTE as rotas disponíveis do estado atual
2. Use rota_de_sucesso quando o objetivo do estado foi alcançado
3. Use rota_de_persistencia quando precisa insistir na mesma pergunta
4. Use rota_de_escape quando o cliente não se qualifica ou desiste
5. SEMPRE justifique sua decisão baseado nos critérios do estado`,

            fsmValidatorPrompt: `Você é um validador de dados FSM. Valide se o dado extraído está correto e completo.

Regras:
1. Verifique se o dado corresponde ao tipo esperado (string, number, boolean)
2. Verifique se o dado atende aos critérios do estado
3. Para valores ambíguos, retorne inválido
4. Retorne { valid: boolean, reason: string }`,
        },
        create: {
            name: 'Assistente KRUGER',
            description: 'Agente especializado em qualificação de leads para consultoria jurídica em passivos bancários',
            tone: Tone.FRIENDLY,
            instance: 'kruger',
            userId: user.id,
            organizationId: organization.id,

            personality: `Você é uma assistente virtual empática e profissional da KRUGER, escritório especializado em consultoria jurídica para passivos bancários.

Características:
- Empática e acolhedora com clientes em dificuldades financeiras
- Profissional e consultiva, sem ser intimidadora
- Educativa, explicando conceitos de forma clara
- Objetiva na coleta de informações
- Paciente e persistente, mas respeitosa`,

            systemPrompt: 'Qualifique leads para consultoria jurídica em passivos bancários. Critérios: dívida >= 60k, bancos principais (Itaú, Bradesco, Santander, BB, Caixa), não apenas cheque especial.',

            fsmDataExtractorPrompt: `Você é um extrator de dados especializado. Analise a mensagem do cliente e extraia APENAS os dados solicitados para o estado atual.

Regras:
1. Retorne APENAS o dado solicitado, sem informações extras
2. Se o dado não estiver presente, retorne null
3. Normalize os dados (ex: "sessenta mil" → 60000)
4. Para valores monetários, retorne apenas números
5. Para nomes, retorne apenas o primeiro nome
6. Para bancos, normalize o nome (ex: "itau" → "Itaú")`,

            fsmStateDeciderPrompt: `Você é um decisor de estados FSM. Analise a mensagem do cliente e os dados extraídos para decidir qual rota seguir.

FORMATO DE SAÍDA OBRIGATÓRIO:
Retorne APENAS um objeto JSON com exatamente estes 4 campos:
{
  "pensamento": ["passo 1", "passo 2", "..."],
  "estado_escolhido": "NOME_DO_ESTADO",
  "veredito": "SUCESSO|FALHA|PENDENTE|ERRO",
  "rota_escolhida": "rota_de_sucesso|rota_de_persistencia|rota_de_escape"
}

Regras:
1. Siga ESTRITAMENTE as rotas disponíveis do estado atual
2. Use rota_de_sucesso quando o objetivo do estado foi alcançado (veredito: SUCESSO)
3. Use rota_de_persistencia quando precisa insistir na mesma pergunta (veredito: FALHA ou PENDENTE)
4. Use rota_de_escape quando o cliente não se qualifica ou desiste (veredito: FALHA)
5. SEMPRE justifique sua decisão no array pensamento
6. NUNCA omita nenhum dos 4 campos obrigatórios`,

            fsmValidatorPrompt: `Você é um validador de dados FSM. Valide se o dado extraído está correto e completo.

Regras:
1. Verifique se o dado corresponde ao tipo esperado (string, number, boolean)
2. Verifique se o dado atende aos critérios do estado
3. Para valores ambíguos, retorne inválido
4. Retorne { valid: boolean, reason: string }`,
        },
    });
    console.log(`✅ Agente: ${agent.name}`);

    // Criar estados FSM com dataKeys configurados
    const statesData = [
        {
            name: 'INICIO',
            order: 1,
            missionPrompt: 'Apresentar-se como Adriana e coletar nome do cliente',
            dataKey: 'nome_cliente',
            dataType: 'string',
            dataDescription: 'Nome do cliente (apenas primeiro nome)'
        },
        {
            name: 'VALOR_DIVIDA',
            order: 2,
            missionPrompt: 'Perguntar valor da dívida',
            dataKey: 'valor_divida',
            dataType: 'number',
            dataDescription: 'Valor total da dívida em reais. Se informar parcelas (ex: 72x de 2.126), multiplicar. Se informar valores fracionados, somar. Antes de consolidar, verificar se valores como 400, 50, 250 são reais ou milhares.'
        },
        {
            name: 'BANCO_LEAD',
            order: 3,
            missionPrompt: 'Identificar banco',
            dataKey: 'divida_banco',
            dataType: 'string',
            dataDescription: 'Nome do banco onde o cliente possui dívidas'
        },
        {
            name: 'MODALIDADE_DIV',
            order: 4,
            missionPrompt: 'Tipo de crédito',
            dataKey: 'modalidades_credito',
            dataType: 'string',
            dataDescription: 'Modalidade de crédito da dívida (cartão, empréstimo pessoal, capital de giro, cheque especial, etc). Se múltiplos bancos, formato: "Itau cartão, Santander empréstimo pessoal"'
        },
        {
            name: 'ATRASO_DIV',
            order: 5,
            missionPrompt: 'Verificar atraso',
            dataKey: 'atraso',
            dataType: 'string',
            dataDescription: 'Situação de atraso da dívida (ex: atrasada 3 meses, em dia, etc)'
        },
        {
            name: 'FICAR_ATRASO',
            order: 6,
            missionPrompt: 'Explicar dinâmica',
            dataKey: 'abertura_atraso',
            dataType: 'string',
            dataDescription: 'Cliente demonstra abertura para ficar em atraso ou já está em atraso em alguma dívida'
        },
        {
            name: 'EXPLICAR_METODO',
            order: 7,
            missionPrompt: 'Explicar método'
        },
        {
            name: 'GARANTIA_DIV',
            order: 8,
            missionPrompt: 'Verificar garantias',
            dataKey: 'garantia',
            dataType: 'string',
            dataDescription: 'Tipo de garantia da dívida (casa, carro, terreno, contas a receber, sem garantia, etc)'
        },
        {
            name: 'OFERTA_REUNIAO',
            order: 9,
            missionPrompt: 'Oferecer reunião',
            dataKey: 'interesse_reunião',
            dataType: 'string',
            dataDescription: 'Cliente concordou em agendar uma reunião'
        },
        {
            name: 'AGENDAMENTO_INICIAR_E_SUGERIR',
            order: 10,
            missionPrompt: 'Sugerir horários',
            dataKey: 'horario_escolhido',
            dataType: 'string',
            dataDescription: 'Dia e horário escolhido pelo cliente (ex: segunda-feira às 09h, terça-feira 10h). Deve ser específico, rejeitar respostas vagas como "qualquer dia". Armazenar exatamente como cliente confirmou.'
        },
        {
            name: 'AGENDAMENTO_VERIFICAR_DISPONIBILIDADE',
            order: 11,
            missionPrompt: 'Verificar disponibilidade',
            dataKey: 'verificar_agenda',
            dataType: 'string',
            dataDescription: 'Verificação se agendamento já foi criado através da ferramenta criar_evento'
        },
        {
            name: 'AGENDAMENTO_CONFIRMAR_E_CRIAR',
            order: 12,
            missionPrompt: 'Confirmar agendamento e criar evento no calendário',
            dataKey: 'agendamento_confirmado',
            dataType: 'string',
            dataDescription: 'Confirmação de que agendamento foi criado no sistema',
            tools: JSON.stringify(['criar_evento'])
        },
        {
            name: 'AGENDAMENTO_CONFIRMADO',
            order: 13,
            missionPrompt: 'Agendamento confirmado'
        },
        {
            name: 'DESCARTE',
            order: 14,
            missionPrompt: 'Encerrar atendimento'
        },
        {
            name: 'MULTIPLOS_BANCOS',
            order: 15,
            missionPrompt: 'Tratar múltiplos bancos',
            dataKey: 'saldo_bancos',
            dataType: 'string',
            dataDescription: 'Pares explícitos de banco + valor (ex: "itau 150 mil, santander 50 mil"). Salvar apenas se cliente informar valores específicos para cada banco. Não inferir ou dividir proporcionalmente.'
        },
    ];

    for (const stateData of statesData) {
        await prisma.state.upsert({
            where: { agentId_name: { agentId: agent.id, name: stateData.name } },
            update: {
                availableRoutes: fsmRoutes[stateData.name as keyof typeof fsmRoutes] || {},
            },
            create: {
                ...stateData,
                availableRoutes: fsmRoutes[stateData.name as keyof typeof fsmRoutes] || {},
                agentId: agent.id,
                organizationId: organization.id,
            },
        });
    }
    console.log(`✅ ${statesData.length} estados FSM criados`);

    // Configurar estado inicial
    const inicioState = await prisma.state.findFirst({
        where: { agentId: agent.id, name: 'INICIO' },
    });
    if (inicioState) {
        await prisma.agent.update({
            where: { id: agent.id },
            data: { initialStateId: inicioState.id },
        });
    }

    // Criar leads de exemplo
    const leads = [
        { name: 'João Silva', phone: '5511987654321', email: 'joao@example.com' },
        { name: 'Maria Santos', phone: '5511987654322', email: 'maria@example.com' },
    ];

    for (const leadData of leads) {
        await prisma.lead.upsert({
            where: { phone: leadData.phone },
            update: {},
            create: {
                ...leadData,
                status: LeadStatus.NEW,
                agentId: agent.id,
                organizationId: organization.id,
            },
        });
    }
    console.log(`✅ ${leads.length} leads criados`);

    console.log('\n🎉 Seed KRUGER concluído!');
    console.log(`   Login: ${user.email} / admin123`);
}

main()
    .catch((e) => {
        console.error('❌ Erro:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
