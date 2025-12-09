
import { PrismaClient } from '@prisma/client';
import { executeFSMTool } from './app/lib/fsm-engine/tools-handler';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Scheduling Lifecycle Test ---');

    // 1. Setup - Find Org and Lead
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error('No organization found');

    const lead = await prisma.lead.findFirst({
        where: { organizationId: org.id }
    });
    if (!lead) throw new Error('No lead found');

    console.log(`Using Org: ${org.name} (${org.id})`);
    console.log(`Using Lead: ${lead.name} (${lead.id})`);

    const context = {
        organizationId: org.id,
        leadId: lead.id,
        conversationId: 'test-lifecycle-' + Date.now()
    };

    // 2. Create Appointment (Tomorrow 10:00)
    console.log('\n[1] Testing Create...');
    const createRes = await executeFSMTool('criar_evento', {
        date: 'amanhã',
        time: '14:00',
        notes: 'Teste Lifecycle'
    }, context);
    console.log('Create Result:', createRes);

    if (!createRes.success) throw new Error('Failed to create');
    const appointmentId = createRes.data?.appointmentId;
    console.log('Appointment Created:', appointmentId);

    // 3. Reschedule (Tomorrow 16:00)
    console.log('\n[2] Testing Reschedule...');
    const reschedRes = await executeFSMTool('reagendar_evento', {
        date: 'amanhã',
        time: '16:00'
    }, context);
    console.log('Reschedule Result:', reschedRes);

    if (!reschedRes.success) throw new Error('Failed to reschedule');

    // Verify DB
    const updatedApp = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    console.log('Updated DB Appointment Time:', updatedApp?.scheduledAt);

    // 4. Cancel
    console.log('\n[3] Testing Cancel...');
    const cancelRes = await executeFSMTool('cancelar_evento', {}, context);
    console.log('Cancel Result:', cancelRes);

    if (!cancelRes.success) throw new Error('Failed to cancel');

    // Verify DB
    const cancelledApp = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    console.log('Cancelled DB Appointment Status:', cancelledApp?.status);

    console.log('\n--- Lifecycle Test Completed Successfully ---');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
