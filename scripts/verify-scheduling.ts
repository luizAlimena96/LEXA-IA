import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verificando Sistema de Agendamento...\n');

    const agent = await prisma.agent.findFirst({
        where: { instance: 'kruger' },
        include: {
            states: {
                where: {
                    name: {
                        in: [
                            'AGENDAMENTO_INICIAR_E_SUGERIR',
                            'AGENDAMENTO_VERIFICAR_DISPONIBILIDADE',
                            'AGENDAMENTO_CONFIRMAR_E_CRIAR',
                            'AGENDAMENTO_CONFIRMADO'
                        ]
                    }
                },
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!agent) {
        console.error('❌ Agente não encontrado');
        return;
    }

    console.log(`✅ Agente encontrado: ${agent.name}\n`);

    // 1. Verificar Estados
    console.log('📋 ESTADOS DE AGENDAMENTO:');
    console.log('─'.repeat(80));

    const expectedStates = [
        'AGENDAMENTO_INICIAR_E_SUGERIR',
        'AGENDAMENTO_VERIFICAR_DISPONIBILIDADE',
        'AGENDAMENTO_CONFIRMAR_E_CRIAR',
        'AGENDAMENTO_CONFIRMADO'
    ];

    const foundStates = agent.states.map(s => s.name);
    const missingStates = expectedStates.filter(s => !foundStates.includes(s));

    if (missingStates.length > 0) {
        console.log(`\n❌ Estados faltando: ${missingStates.join(', ')}`);
    } else {
        console.log('\n✅ Todos os estados de agendamento existem');
    }

    // 2. Verificar DataKeys
    console.log('\n📊 DATAKEYS CONFIGURADOS:');
    console.log('─'.repeat(80));

    for (const state of agent.states) {
        console.log(`\n${state.name}:`);
        console.log(`  • dataKey: ${state.dataKey || '❌ NÃO CONFIGURADO'}`);
        console.log(`  • dataType: ${state.dataType || '❌ NÃO CONFIGURADO'}`);
        console.log(`  • dataDescription: ${state.dataDescription ? '✅' : '❌'}`);
        console.log(`  • missionPrompt: ${state.missionPrompt ? '✅' : '❌'}`);
    }

    // 3. Verificar Rotas
    console.log('\n🔀 ROTAS ENTRE ESTADOS:');
    console.log('─'.repeat(80));

    for (const state of agent.states) {
        const routes = state.availableRoutes as any;
        if (routes && routes.rota_de_sucesso) {
            console.log(`\n${state.name} → ${JSON.stringify(routes.rota_de_sucesso, null, 2)}`);
        }
    }

    // 4. Verificar Configurações do Agente
    console.log('\n⚙️  CONFIGURAÇÕES DO AGENTE:');
    console.log('─'.repeat(80));
    console.log(`  • Google Calendar: ${agent.googleCalendarEnabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
    console.log(`  • Lembretes: ${agent.reminderEnabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
    console.log(`  • Notificações: ${agent.notificationEnabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
    console.log(`  • Duração padrão: ${agent.meetingDuration} minutos`);
    console.log(`  • Buffer time: ${agent.bufferTime} minutos`);

    // 5. Verificar Agendamentos Existentes
    const appointments = await prisma.appointment.findMany({
        where: { organizationId: agent.organizationId },
        orderBy: { scheduledAt: 'desc' },
        take: 5,
        include: { lead: true }
    });

    console.log('\n📅 ÚLTIMOS AGENDAMENTOS:');
    console.log('─'.repeat(80));

    if (appointments.length === 0) {
        console.log('  ℹ️  Nenhum agendamento encontrado');
    } else {
        for (const apt of appointments) {
            console.log(`\n  • ${apt.title}`);
            console.log(`    Data: ${apt.scheduledAt.toLocaleString('pt-BR')}`);
            console.log(`    Status: ${apt.status}`);
            console.log(`    Lead: ${apt.lead?.name || 'N/A'}`);
        }
    }

    // 6. Resumo Final
    console.log('\n\n📊 RESUMO:');
    console.log('═'.repeat(80));

    const issues: string[] = [];

    if (missingStates.length > 0) {
        issues.push(`❌ ${missingStates.length} estado(s) faltando`);
    }

    const statesWithoutDataKey = agent.states.filter(s => !s.dataKey);
    if (statesWithoutDataKey.length > 0) {
        issues.push(`⚠️  ${statesWithoutDataKey.length} estado(s) sem dataKey`);
    }

    if (!agent.googleCalendarEnabled) {
        issues.push('ℹ️  Google Calendar não habilitado');
    }

    if (issues.length === 0) {
        console.log('\n✅ Sistema de agendamento está 100% configurado!');
    } else {
        console.log('\n⚠️  Problemas encontrados:');
        issues.forEach(issue => console.log(`  ${issue}`));
    }

    console.log('\n');
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
