import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Atualizando estado INICIO...');

    // Buscar o agente
    const agent = await prisma.agent.findFirst({
        where: { instance: 'kruger' }
    });

    if (!agent) {
        console.error('❌ Agente não encontrado');
        return;
    }

    // Atualizar estado INICIO
    const updated = await prisma.state.updateMany({
        where: {
            agentId: agent.id,
            name: 'INICIO'
        },
        data: {
            missionPrompt: 'Apresentar-se como Adriana e coletar nome do cliente',
            dataKey: 'nome_cliente',
            dataType: 'string',
            dataDescription: 'Nome do cliente (apenas primeiro nome)'
        }
    });

    console.log(`✅ Estado INICIO atualizado: ${updated.count} registro(s)`);
}

main()
    .catch((e) => {
        console.error('❌ Erro:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
