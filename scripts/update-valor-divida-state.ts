import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Atualizando estado VALOR_DIVIDA...');

    // Buscar o agente
    const agent = await prisma.agent.findFirst({
        where: { instance: 'kruger' }
    });

    if (!agent) {
        console.error('❌ Agente não encontrado');
        return;
    }

    // Atualizar estado VALOR_DIVIDA
    const updated = await prisma.state.updateMany({
        where: {
            agentId: agent.id,
            name: 'VALOR_DIVIDA'
        },
        data: {
            dataKey: 'valor_divida',
            dataType: 'number',
            dataDescription: 'Valor total da dívida em reais (apenas número)'
        }
    });

    console.log(`✅ Estado VALOR_DIVIDA atualizado: ${updated.count} registro(s)`);
}

main()
    .catch((e) => {
        console.error('❌ Erro:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
