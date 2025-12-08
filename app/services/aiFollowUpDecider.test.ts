/**
 * Teste do AI Follow-up Decider
 * Demonstra o comportamento com mensagens sem referência temporal explícita
 */

import { decideFollowUpTiming, formatFollowUpDecision } from './aiFollowUpDecider';

/**
 * CASO DE USO REAL: "Vou no banco" na sexta-feira
 */
export async function testeVouNoBancoSexta() {
    console.log('='.repeat(60));
    console.log('TESTE: "Vou no banco" na SEXTA-FEIRA 14h');
    console.log('='.repeat(60));

    const decision = await decideFollowUpTiming(
        {
            lastMessage: 'Vou no banco',
            currentDate: new Date('2024-12-06T14:00:00'), // Sexta 14h
            leadName: 'João Silva',
        },
        process.env.OPENAI_API_KEY!
    );

    console.log(formatFollowUpDecision(decision));
    console.log('\n✅ ESPERADO: Segunda-feira 10:00');
    console.log(`📅 RESULTADO: ${decision.scheduledFor.toLocaleString('pt-BR')}`);
    console.log(`💡 RAZÃO: ${decision.reason}`);
}

/**
 * COMPARAÇÃO: Mesma mensagem em dias diferentes
 */
export async function testeComparativoDias() {
    const mensagem = 'Vou no banco pegar o documento';

    const cenarios = [
        {
            nome: 'Segunda-feira 10h',
            data: new Date('2024-12-02T10:00:00'),
            esperado: 'Segunda 16h (6h depois)',
        },
        {
            nome: 'Terça-feira 14h',
            data: new Date('2024-12-03T14:00:00'),
            esperado: 'Quarta 10h (20h depois)',
        },
        {
            nome: 'Quinta-feira 17h',
            data: new Date('2024-12-05T17:00:00'),
            esperado: 'Sexta 14h (21h depois)',
        },
        {
            nome: 'Sexta-feira 14h',
            data: new Date('2024-12-06T14:00:00'),
            esperado: 'Segunda 10h (72h depois)',
        },
        {
            nome: 'Sexta-feira 16h',
            data: new Date('2024-12-06T16:00:00'),
            esperado: 'Segunda 10h (66h depois)',
        },
    ];

    console.log('='.repeat(80));
    console.log('TESTE COMPARATIVO: "Vou no banco" em diferentes dias');
    console.log('='.repeat(80));

    for (const cenario of cenarios) {
        console.log(`\n📅 ${cenario.nome}`);
        console.log(`   Esperado: ${cenario.esperado}`);

        const decision = await decideFollowUpTiming(
            {
                lastMessage: mensagem,
                currentDate: cenario.data,
            },
            process.env.OPENAI_API_KEY!
        );

        const diaSemana = decision.scheduledFor.toLocaleDateString('pt-BR', { weekday: 'long' });
        const horario = decision.scheduledFor.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        console.log(`   Resultado: ${diaSemana} ${horario}`);
        console.log(`   Confiança: ${(decision.confidence * 100).toFixed(0)}%`);
        console.log(`   Razão: ${decision.reason.substring(0, 80)}...`);
    }
}

/**
 * TESTE: Diferentes ações em sexta-feira
 */
export async function testeDiferentesAcoesSexta() {
    const cenarios = [
        'Vou no banco',
        'Vou pegar o documento',
        'Preciso resolver isso',
        'Vou falar com meu sócio',
        'Vou pensar melhor',
        'Vou ver com a esposa',
    ];

    console.log('='.repeat(80));
    console.log('TESTE: Diferentes ações na SEXTA-FEIRA 15h');
    console.log('='.repeat(80));

    const sextaFeira = new Date('2024-12-06T15:00:00');

    for (const mensagem of cenarios) {
        console.log(`\n💬 "${mensagem}"`);

        const decision = await decideFollowUpTiming(
            {
                lastMessage: mensagem,
                currentDate: sextaFeira,
            },
            process.env.OPENAI_API_KEY!
        );

        const quando = decision.scheduledFor.toLocaleString('pt-BR', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });

        console.log(`   📅 Follow-up: ${quando}`);
        console.log(`   🎯 Ação: ${decision.extractedIntent.action || 'N/A'}`);
        console.log(`   ⏱️  Horas: ${decision.extractedIntent.estimatedDuration || 'N/A'}h`);
    }
}

/**
 * TESTE COMPLETO: Executar todos os testes
 */
export async function executarTodosTestes() {
    try {
        await testeVouNoBancoSexta();
        console.log('\n\n');

        await testeComparativoDias();
        console.log('\n\n');

        await testeDiferentesAcoesSexta();

        console.log('\n\n✅ Todos os testes concluídos!');
    } catch (error) {
        console.error('❌ Erro nos testes:', error);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    executarTodosTestes();
}
