
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log('Checking recent appointments...');
    try {
        const appointments = await prisma.appointment.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { lead: true }
        });

        console.log('Found appointments:', appointments.length);
        appointments.forEach(app => {
            console.log(`- [${app.id}] ${app.title} (${app.scheduledAt}) - Lead: ${app.lead?.name}`);
            console.log(`  Details: status=${app.status}, googleEventId=${app.googleEventId}`);
        });
    } catch (e) {
        console.error('Error fetching appointments:', e);
    }
}

check()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
