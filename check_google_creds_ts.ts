
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log('Checking agents google credentials...');
    const agents = await prisma.agent.findMany({
        select: {
            id: true,
            name: true,
            googleCalendarEnabled: true,
            googleAccessToken: true,
            googleRefreshToken: true
        }
    });

    agents.forEach(agent => {
        console.log(`Agent: ${agent.name}`);
        console.log(`- Google Calendar Enabled: ${agent.googleCalendarEnabled}`);
        console.log(`- Has Access Token: ${!!agent.googleAccessToken}`);
        console.log(`- Has Refresh Token: ${!!agent.googleRefreshToken}`);
    });
}

check()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
