import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Testing Endpoint Logic...\n');

    // 1. Test /api/organizations
    console.log('1️⃣ Testing /api/organizations logic...');
    try {
        const orgs = await prisma.organization.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                zapSignApiToken: true, // Critical check
                zapSignTemplateId: true, // Critical check
            }
        });
        console.log(`✅ Success! Found ${orgs.length} organizations.`);
        console.log('   Sample:', orgs[0]);
    } catch (e) {
        console.error('❌ Failed /api/organizations:', e);
    }

    // 2. Test Dashboard Metrics (requires orgId)
    console.log('\n2️⃣ Testing Dashboard Metrics logic...');
    try {
        const demoOrg = await prisma.organization.findFirst({ where: { slug: 'demo' } });
        if (demoOrg) {
            const leads = await prisma.lead.count({ where: { organizationId: demoOrg.id } });
            const conversations = await prisma.conversation.count({ where: { organizationId: demoOrg.id } });
            console.log(`✅ Success! Metrics for ${demoOrg.name}: ${leads} leads, ${conversations} conversations.`);
        } else {
            console.error('❌ Demo org not found!');
        }
    } catch (e) {
        console.error('❌ Failed Dashboard Metrics:', e);
    }

    // 3. Test FSM States
    console.log('\n3️⃣ Testing FSM States...');
    try {
        const states = await prisma.state.findMany({
            orderBy: { order: 'asc' }
        });
        console.log(`✅ Success! Found ${states.length} states.`);
        const stateNames = states.map(s => s.name);
        console.log('   States:', stateNames.join(', '));

        const expected = ['INICIO', 'QUALIFICACAO', 'PROPOSTA', 'AGENDAMENTO', 'FECHAMENTO', 'COLETA_DADOS', 'ENVIO_CONTRATO', 'AGUARDANDO_ASSINATURA'];
        const missing = expected.filter(s => !stateNames.includes(s));

        if (missing.length === 0) {
            console.log('✅ All expected FSM states are present.');
        } else {
            console.error('❌ Missing states:', missing);
        }
    } catch (e) {
        console.error('❌ Failed FSM States:', e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
