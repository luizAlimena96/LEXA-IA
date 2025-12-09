
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Fixing FSM States ---');

    // 1. Find the target Agent
    // We assume the one with AGENDAMENTO_CONFIRMADO
    const confState = await prisma.state.findFirst({
        where: { name: 'AGENDAMENTO_CONFIRMADO' }
    });

    if (!confState) throw new Error('State AGENDAMENTO_CONFIRMADO not found');
    const agentId = confState.agentId;
    const organizationId = confState.organizationId;

    console.log(`Agent ID: ${agentId}`);

    // 2. Create/Update AGENDAMENTO_GERENCIAR
    const manageStateName = 'AGENDAMENTO_GERENCIAR';

    // Check if exists
    let manageState = await prisma.state.findUnique({
        where: {
            agentId_name: {
                agentId,
                name: manageStateName
            }
        }
    });

    const manageStateData = {
        missionPrompt: "Gerenciar agendamento existente: reagendar (mudar data/hora) ou cancelar. Se o cliente quiser reagendar, pergunte a nova data e horário e use a ferramenta 'reagendar_evento'. Se quiser cancelar, use 'cancelar_evento'.",
        dataKey: "acao_agendament", // minor typo to keep unique or short? "acao_agendamento"
        dataDescription: "Ação realizada: reagendou ou cancelou",
        dataType: "string",
        tools: JSON.stringify(["reagendar_evento", "cancelar_evento"]),
        availableRoutes: {
            "rota_de_sucesso": [
                {
                    "estado": "AGENDAMENTO_CONFIRMADO",
                    "descricao": "Agendamento reagendado com sucesso"
                },
                {
                    "estado": "FIM",
                    "descricao": "Agendamento cancelado"
                }
            ],
            "rota_de_escape": [
                {
                    "estado": "INICIO", // Or default start
                    "descricao": "Cliente mudou de assunto"
                }
            ],
            "rota_de_persistencia": [
                {
                    "estado": "AGENDAMENTO_GERENCIAR",
                    "descricao": "Tentando obter detalhes para reagendar/cancelar"
                }
            ]
        },
        order: 14,
        agentId,
        organizationId
    };

    if (manageState) {
        console.log(`Updating ${manageStateName}...`);
        manageState = await prisma.state.update({
            where: { id: manageState.id },
            data: manageStateData
        });
    } else {
        console.log(`Creating ${manageStateName}...`);
        manageState = await prisma.state.create({
            data: {
                name: manageStateName,
                ...manageStateData
            }
        });
    }
    console.log(`State ${manageStateName} ready (${manageState.id})`);

    // 3. Update AGENDAMENTO_CONFIRMADO transitions
    // Add route to AGENDAMENTO_GERENCIAR
    const currentConf = await prisma.state.findUnique({ where: { id: confState.id } });
    if (!currentConf) return;

    const routes: any = currentConf.availableRoutes || {};

    // Add to escape/success routes if not present
    // We want to allow going to manage if user asks
    const transition = {
        "estado": manageStateName,
        "descricao": "Cliente deseja alterar, reagendar ou cancelar a reunião confirmada"
    };

    // Helper to add if not exists
    const addTransition = (key: string) => {
        if (!routes[key]) routes[key] = [];
        const exists = routes[key].find((r: any) => r.estado === manageStateName);
        if (!exists) {
            routes[key].push(transition);
            console.log(`Added transition to ${manageStateName} in ${key}`);
        }
    };

    addTransition('rota_de_escape');
    addTransition('rota_de_sucesso');
    // Usually "confirmed" has empty routes because it's final, but we need escape.

    await prisma.state.update({
        where: { id: confState.id },
        data: { availableRoutes: routes }
    });

    console.log('Updated AGENDAMENTO_CONFIRMADO routes');
}

main().catch(console.error).finally(async () => await prisma.$disconnect());
