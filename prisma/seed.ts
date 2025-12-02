import { PrismaClient, LeadStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Create Super Admin User
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@lexa.com' },
        update: {},
        create: {
            email: 'admin@lexa.com',
            name: 'Super Admin',
            password: await bcrypt.hash('admin123', 10),
            role: 'SUPER_ADMIN',
        },
    });
    console.log('✅ Super Admin created:', superAdmin.email);

    // 2. Create Demo Organization
    const demoOrg = await prisma.organization.upsert({
        where: { slug: 'demo' },
        update: {},
        create: {
            name: 'DEMO',
            slug: 'demo',
            email: 'contato@demo.com',
            phone: '5511999999999',
            isActive: true,
            evolutionInstanceName: 'demo',
            openaiModel: 'gpt-4o-mini',
            elevenLabsModel: 'eleven_multilingual_v2',
        },
    });
    console.log('✅ Demo Organization created:', demoOrg.name);

    // 3. Create Demo Admin User
    const demoAdmin = await prisma.user.upsert({
        where: { email: 'admin@demo.com' },
        update: {},
        create: {
            email: 'admin@demo.com',
            name: 'Admin Demo',
            password: await bcrypt.hash('demo123', 10),
            role: 'ADMIN',
            organizationId: demoOrg.id,
        },
    });
    console.log('✅ Demo Admin created:', demoAdmin.email);

    // 3.1 Create ACME Organization (Second Org for testing)
    const acmeOrg = await prisma.organization.upsert({
        where: { slug: 'acme' },
        update: {},
        create: {
            name: 'ACME Corp',
            slug: 'acme',
            email: 'contato@acme.com',
            phone: '5511988888888',
            isActive: true,
            evolutionInstanceName: 'acme',
            openaiModel: 'gpt-4o',
            elevenLabsModel: 'eleven_multilingual_v2',
        },
    });
    console.log('✅ ACME Organization created:', acmeOrg.name);

    // 3.2 Create ACME Admin User
    const acmeAdmin = await prisma.user.upsert({
        where: { email: 'admin@acme.com' },
        update: {},
        create: {
            email: 'admin@acme.com',
            name: 'Admin ACME',
            password: await bcrypt.hash('acme123', 10),
            role: 'ADMIN',
            organizationId: acmeOrg.id,
        },
    });
    console.log('✅ ACME Admin created:', acmeAdmin.email);

    // 4. Create Demo Agent
    const demoAgent = await prisma.agent.upsert({
        where: { instance: 'demo' },
        update: {},
        create: {
            name: 'LEXA - Demo',
            description: 'Assistente virtual de demonstração',
            tone: 'FRIENDLY',
            language: 'pt-BR',
            instance: 'demo',
            personality: `Você é a LEXA, assistente virtual inteligente. Você é amigável, prestativa e profissional. 

Seu objetivo é:
- Dar boas-vindas aos clientes
- Entender suas necessidades
- Oferecer soluções personalizadas
- Agendar reuniões quando apropriado
- Manter um tom profissional mas amigável`,
            systemPrompt: `Você deve:
1. Ser educada e profissional
2. Fazer perguntas para entender a necessidade do cliente
3. Usar a base de conhecimento para responder perguntas
4. Oferecer agendamento de reuniões quando apropriado
5. Seguir os estados da FSM (Finite State Machine)`,
            workingHours: {
                seg: { enabled: true, start: '08:00', end: '18:00' },
                ter: { enabled: true, start: '08:00', end: '18:00' },
                qua: { enabled: true, start: '08:00', end: '18:00' },
                qui: { enabled: true, start: '08:00', end: '18:00' },
                sex: { enabled: true, start: '08:00', end: '18:00' },
                sab: { enabled: false, start: '09:00', end: '13:00' },
                dom: { enabled: false, start: '09:00', end: '13:00' },
            },
            meetingDuration: 60,
            bufferTime: 15,
            reminderEnabled: true,
            reminderHours: 2,
            reminderMessage: 'Olá {lead.name}! Lembrete: você tem uma reunião agendada para {appointment.date}',
            followupEnabled: true,
            followupDelay: 24,
            organizationId: demoOrg.id,
            userId: demoAdmin.id,
        },
    });
    console.log('✅ Demo Agent created:', demoAgent.name);

    // 5. Create FSM States
    const states = [
        {
            name: 'INICIO',
            missionPrompt: 'Você está no estado INICIO. Dê boas-vindas ao cliente de forma amigável e pergunte como pode ajudar. Identifique a necessidade dele.',
            availableRoutes: {
                success: 'QUALIFICACAO',
                persistence: 'INICIO',
                escape: null,
            },
            order: 1,
        },
        {
            name: 'QUALIFICACAO',
            missionPrompt: 'Você está no estado QUALIFICACAO. Colete os dados do cliente: nome completo, email e telefone. Seja educado e explique que precisa dessas informações para melhor atendê-lo.',
            availableRoutes: {
                success: 'PROPOSTA',
                persistence: 'QUALIFICACAO',
                escape: 'INICIO',
            },
            order: 2,
        },
        {
            name: 'PROPOSTA',
            missionPrompt: 'Você está no estado PROPOSTA. Com base na necessidade identificada, apresente a solução mais adequada. Use a base de conhecimento para fornecer informações precisas sobre produtos e preços.',
            availableRoutes: {
                success: 'AGENDAMENTO',
                persistence: 'PROPOSTA',
                escape: 'QUALIFICACAO',
            },
            order: 3,
        },
        {
            name: 'AGENDAMENTO',
            missionPrompt: 'Você está no estado AGENDAMENTO. Ofereça agendar uma reunião para discutir a proposta em detalhes. Sugira horários disponíveis e confirme os dados do cliente.',
            availableRoutes: {
                success: 'FECHAMENTO',
                persistence: 'AGENDAMENTO',
                escape: 'PROPOSTA',
            },
            order: 4,
        },
        {
            name: 'FECHAMENTO',
            missionPrompt: 'Você está no estado FECHAMENTO. Confirme o interesse do cliente, recapitule os próximos passos e agradeça pelo contato. Deixe claro que está disponível para dúvidas.',
            availableRoutes: {
                success: null,
                persistence: 'FECHAMENTO',
                escape: 'AGENDAMENTO',
            },
            order: 5,
        },
        {
            name: 'COLETA_DADOS',
            missionPrompt: `Você está no estado COLETA_DADOS. Colete SISTEMATICAMENTE os seguintes dados do cliente:
1. CPF (apenas números, formato XXX.XXX.XXX-XX)
2. Data de nascimento (formato DD/MM/AAAA)
3. Endereço completo (Rua, número, bairro, cidade, estado)
4. Estado civil (Solteiro/Casado/Divorciado/Viúvo)
5. Profissão

Pergunte um dado por vez. Seja educado e explique que essas informações são necessárias para o contrato.`,
            availableRoutes: {
                success: 'ENVIO_CONTRATO',
                persistence: 'COLETA_DADOS',
                escape: 'QUALIFICACAO',
            },
            order: 6,
        },
        {
            name: 'ENVIO_CONTRATO',
            missionPrompt: `Você está no estado ENVIO_CONTRATO. Informe ao cliente que o contrato será enviado para assinatura digital via WhatsApp.

Verifique se todos os dados necessários foram coletados:
- Nome completo, CPF, Email, Telefone
- Data de nascimento, Endereço completo
- Estado civil, Profissão

Se algum dado estiver faltando, volte para COLETA_DADOS.`,
            availableRoutes: {
                success: 'AGUARDANDO_ASSINATURA',
                persistence: 'ENVIO_CONTRATO',
                escape: 'COLETA_DADOS',
            },
            order: 7,
        },
        {
            name: 'AGUARDANDO_ASSINATURA',
            missionPrompt: 'Você está no estado AGUARDANDO_ASSINATURA. O contrato foi enviado. Informe ao cliente que ele receberá um link para assinatura digital. Ofereça ajuda caso tenha dúvidas.',
            availableRoutes: {
                success: 'FECHAMENTO',
                persistence: 'AGUARDANDO_ASSINATURA',
                escape: 'ENVIO_CONTRATO',
            },
            order: 8,
        },
    ];

    for (const state of states) {
        await prisma.state.upsert({
            where: {
                agentId_name: {
                    agentId: demoAgent.id,
                    name: state.name,
                },
            },
            update: {},
            create: {
                ...state,
                agentId: demoAgent.id,
                organizationId: demoOrg.id,
            },
        });
    }
    console.log('✅ FSM States created: 8 states');

    // 6. Create Leads
    const leadsData: Array<{
        name: string;
        email: string;
        phone: string;
        status: LeadStatus;
        notes: string;
    }> = [
            { name: 'Carlos Silva', email: 'carlos@exemplo.com', phone: '5511988887777', status: 'NEW', notes: 'Interessado em automação' },
            { name: 'Ana Souza', email: 'ana@exemplo.com', phone: '5511977776666', status: 'CONTACTED', notes: 'Pediu para ligar semana que vem' },
            { name: 'Roberto Santos', email: 'roberto@exemplo.com', phone: '5511966665555', status: 'QUALIFIED', notes: 'Orçamento enviado' },
            { name: 'Julia Lima', email: 'julia@exemplo.com', phone: '5511955554444', status: 'WON', notes: 'Cliente fechou contrato' },
            { name: 'Pedro Alves', email: 'pedro@exemplo.com', phone: '5511944443333', status: 'LOST', notes: 'Achou caro' },
        ];

    for (const lead of leadsData) {
        await prisma.lead.upsert({
            where: { phone: lead.phone },
            update: {},
            create: {
                ...lead,
                organizationId: demoOrg.id,
                agentId: demoAgent.id,
                currentState: 'INICIO',
            },
        });
    }
    console.log('✅ Leads created: 5 leads');

    // 7. Create Conversations & Messages
    const leadCarlos = await prisma.lead.findFirst({ where: { email: 'carlos@exemplo.com' } });
    if (leadCarlos) {
        // Delete existing conversation to avoid messageId conflicts
        await prisma.conversation.deleteMany({
            where: { leadId: leadCarlos.id }
        });

        const conversation = await prisma.conversation.create({
            data: {
                whatsapp: leadCarlos.phone,
                organizationId: demoOrg.id,
                agentId: demoAgent.id,
                leadId: leadCarlos.id,
                messages: {
                    create: [
                        { content: 'Olá, gostaria de saber mais sobre a LEXA.', fromMe: false, type: 'TEXT', messageId: 'msg_1' },
                        { content: 'Olá Carlos! Sou a LEXA, assistente virtual. Como posso ajudar você hoje?', fromMe: true, type: 'TEXT', messageId: 'msg_2' },
                        { content: 'Vocês fazem integração com WhatsApp?', fromMe: false, type: 'TEXT', messageId: 'msg_3' },
                        { content: 'Sim! Fazemos integração completa com WhatsApp, permitindo automação de atendimento e vendas.', fromMe: true, type: 'TEXT', messageId: 'msg_4' },
                    ],
                },
            },
        });
        console.log('✅ Conversation created for Carlos');
    }

    // 8. Create Appointments
    const leadJulia = await prisma.lead.findFirst({ where: { email: 'julia@exemplo.com' } });
    if (leadJulia) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(14, 0, 0, 0);

        await prisma.appointment.create({
            data: {
                title: 'Reunião de Onboarding - Julia Lima',
                scheduledAt: tomorrow,
                duration: 60,
                type: 'meeting',
                status: 'SCHEDULED',
                organizationId: demoOrg.id,
                leadId: leadJulia.id,
                source: 'MANUAL',
            },
        });
        console.log('✅ Appointment created for Julia');
    }

    // 9. Create Knowledge Base
    const knowledgeData = [
        { question: 'O que é a LEXA?', answer: 'A LEXA é uma plataforma de agentes de IA para automação de atendimento e vendas.' },
        { question: 'Quanto custa?', answer: 'Nossos planos começam a partir de R$ 297/mês.' },
        { question: 'Tem integração com CRM?', answer: 'Sim, integramos com os principais CRMs do mercado via API.' },
    ];

    for (const item of knowledgeData) {
        await prisma.knowledge.create({
            data: {
                title: item.question,
                content: item.answer,
                type: 'FAQ',
                agentId: demoAgent.id,
                organizationId: demoOrg.id,
            },
        });
    }
    console.log('✅ Knowledge Base created: 3 items');

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('📝 Credentials:');
    console.log('   Super Admin: admin@lexa.com / admin123');
    console.log('   Demo Admin: admin@demo.com / demo123');
    console.log('   ACME Admin: admin@acme.com / acme123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });