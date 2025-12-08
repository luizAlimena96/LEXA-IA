import { PrismaClient, LeadStatus, UserRole, Tone, KnowledgeType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting COMPLETE seed...');
    console.log('Checking partial env:', process.env.DATABASE_URL ? 'Type: ' + typeof process.env.DATABASE_URL : 'MISSING');


    // 1. Create Super Admin User
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@lexa.com' },
        update: {},
        create: {
            email: 'admin@lexa.com',
            name: 'Super Admin',
            password: await bcrypt.hash('admin123', 10),
            role: UserRole.SUPER_ADMIN,
        },
    });
    console.log('✅ Super Admin ensured:', superAdmin.email);

    // ==========================================
    // ORGANIZATION 1: DEMO (Sales Focus)
    // ==========================================
    console.log('\n🏢 Seeding Organization 1: DEMO (Sales)...');

    const demoOrg = await prisma.organization.upsert({
        where: { slug: 'demo' },
        update: {
            evolutionInstanceName: 'demo',
            openaiModel: 'gpt-4o-mini',
        },
        create: {
            name: 'Empresa DEMO',
            slug: 'demo',
            email: 'contato@demo.com',
            phone: '5511999999999',
            isActive: true,
            evolutionInstanceName: 'demo',
            openaiModel: 'gpt-4o-mini',
            elevenLabsModel: 'eleven_multilingual_v2',
        },
    });

    const demoAdmin = await prisma.user.upsert({
        where: { email: 'admin@demo.com' },
        update: {},
        create: {
            email: 'admin@demo.com',
            name: 'Admin Demo',
            password: await bcrypt.hash('demo123', 10),
            role: UserRole.ADMIN,
            organizationId: demoOrg.id,
        },
    });

    // Demo Agent (Sales)
    const demoAgent = await prisma.agent.upsert({
        where: { instance: 'demo' },
        update: {},
        create: {
            name: 'LEXA - Vendas',
            description: 'Especialista em qualificação e vendas',
            tone: Tone.FRIENDLY,
            language: 'pt-BR',
            instance: 'demo',
            personality: 'Você é a LEXA, uma vendedora consultiva experiente. Você é carismática, persuasiva, mas muito ética. Adora usar emojis moderadamente 🚀.',
            systemPrompt: 'Seu objetivo é qualificar leads para venda de software ERP. Qualifique BANT (Budget, Authority, Need, Timing).',
            organizationId: demoOrg.id,
            userId: demoAdmin.id,
        },
    });

    // FSM for Demo Agent
    const demoStates = [
        { name: 'INICIO', order: 1, missionPrompt: 'Acolha o cliente e entenda o motivo do contato.' },
        { name: 'QUALIFICACAO', order: 2, missionPrompt: 'Entenda o tamanho da empresa e dores atuais.' },
        { name: 'APRESENTACAO', order: 3, missionPrompt: 'Apresente a solução ERP focada nas dores citadas.' },
        { name: 'NEGOCIACAO', order: 4, missionPrompt: 'Discuta valores e condições de pagamento.' },
        { name: 'FECHAMENTO', order: 5, missionPrompt: 'Formalize a venda e próximos passos.' },
    ];

    for (const state of demoStates) {
        await prisma.state.upsert({
            where: { agentId_name: { agentId: demoAgent.id, name: state.name } },
            update: {},
            create: {
                ...state,
                availableRoutes: {},
                agentId: demoAgent.id,
                organizationId: demoOrg.id,
            },
        });
    }

    // Leads for Demo
    const demoLeads = [
        { name: 'João Silva', phone: '5511999991111', status: LeadStatus.NEW, email: 'joao@teste.com' },
        { name: 'Maria Santos', phone: '5511999992222', status: LeadStatus.QUALIFIED, email: 'maria@teste.com' },
    ];

    for (const lead of demoLeads) {
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


    // ==========================================
    // ORGANIZATION 2: ACME Corp (Support Focus)
    // ==========================================
    console.log('\n🏢 Seeding Organization 2: ACME Corp (Support)...');

    const acmeOrg = await prisma.organization.upsert({
        where: { slug: 'acme' },
        update: {
            evolutionInstanceName: 'acme',
            openaiModel: 'gpt-4o',
        },
        create: {
            name: 'ACME Corporation',
            slug: 'acme',
            email: 'suporte@acme.com',
            phone: '5511988888888',
            isActive: true,
            evolutionInstanceName: 'acme',
            openaiModel: 'gpt-4o',
            elevenLabsModel: 'eleven_multilingual_v2',
        },
    });

    const acmeAdmin = await prisma.user.upsert({
        where: { email: 'admin@acme.com' },
        update: {},
        create: {
            email: 'admin@acme.com',
            name: 'Admin ACME',
            password: await bcrypt.hash('acme123', 10),
            role: UserRole.ADMIN,
            organizationId: acmeOrg.id,
        },
    });

    // Acme Agent (Support)
    const acmeAgent = await prisma.agent.upsert({
        where: { instance: 'acme_support' },
        update: {},
        create: {
            name: 'Suporte ACME',
            description: 'Agente de suporte técnico Nível 1',
            tone: Tone.PROFESSIONAL,
            language: 'pt-BR',
            instance: 'acme_support',
            personality: 'Você é o Assistente Virtual da ACME. Você é extremamente técnico, preciso e direto. Não usa emojis. Foca em resolver problemas de conectividade e hardware.',
            systemPrompt: 'Siga o roteiro de troubleshooting padrão. Peça número de série do equipamento.',
            organizationId: acmeOrg.id,
            userId: acmeAdmin.id,
        },
    });

    // FSM for Acme Agent
    const acmeStates = [
        { name: 'TRIAGEM', order: 1, missionPrompt: 'Identifique o produto e o problema relatado. Peça o Número de Série.' },
        { name: 'DIAGNOSTICO', order: 2, missionPrompt: 'Realize testes básicos (ligar/desligar, verificar cabos).' },
        { name: 'RESOLUCAO', order: 3, missionPrompt: 'Forneça a instrução de correção ou patch de software.' },
        { name: 'ENCAMINHAMENTO', order: 4, missionPrompt: 'Se não resolvido, abra ticket para Nível 2 e informe prazo.' },
        { name: 'FINALIZACAO', order: 5, missionPrompt: 'Confirme se o cliente precisa de algo mais e encerre.' },
    ];

    for (const state of acmeStates) {
        await prisma.state.upsert({
            where: { agentId_name: { agentId: acmeAgent.id, name: state.name } },
            update: {},
            create: {
                ...state,
                availableRoutes: {},
                agentId: acmeAgent.id,
                organizationId: acmeOrg.id,
            },
        });
    }

    // Leads for Acme
    const acmeLeads = [
        { name: 'Pedro Tech', phone: '5511977771111', status: LeadStatus.NEW, email: 'pedro@tech.com', notes: 'Problema com roteador X2000' },
        { name: 'Ana Gestora', phone: '5511977772222', status: LeadStatus.CONTACTED, email: 'ana@corp.com', notes: 'Dúvida sobre contrato SLA' },
    ];

    for (const lead of acmeLeads) {
        const createdLead = await prisma.lead.upsert({
            where: { phone: lead.phone },
            update: {},
            create: {
                ...lead,
                organizationId: acmeOrg.id,
                agentId: acmeAgent.id,
                currentState: 'TRIAGEM',
            },
        });

        // Create a conversation for Pedro to simulate history
        if (lead.name === 'Pedro Tech') {
            // Clean existing conversation
            await prisma.conversation.deleteMany({
                where: { leadId: createdLead.id }
            });

            await prisma.conversation.create({
                data: {
                    whatsapp: lead.phone,
                    organizationId: acmeOrg.id,
                    agentId: acmeAgent.id,
                    leadId: createdLead.id,
                    messages: {
                        create: [
                            { content: 'Meu roteador parou de funcionar.', fromMe: false, type: 'TEXT', messageId: 'acme_msg_1' },
                            { content: 'Olá Pedro. Sou o suporte da ACME. Poderia me informar o número de série do equipamento?', fromMe: true, type: 'TEXT', messageId: 'acme_msg_2' },
                        ]
                    }
                }
            })
        }
    }

    // Create Knowledge Base for Acme
    await prisma.knowledge.create({
        data: {
            title: 'Manual Roteador X2000',
            content: 'Para resetar o Roteador X2000, segure o botão Reset por 10 segundos. A luz piscará vermelho.',
            type: KnowledgeType.FAQ,
            agentId: acmeAgent.id,
            organizationId: acmeOrg.id,
        }
    });

    console.log('\n🎉 COMPLETE Seed finished!');
    console.log('------------------------------------------------');
    console.log('Credentials:');
    console.log('1. Demo Org: admin@demo.com / demo123');
    console.log('2. ACME Org: admin@acme.com / acme123');
    console.log('------------------------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
