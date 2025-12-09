
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log('Checking organization google credentials...');
    const org = await prisma.organization.findUnique({
        where: { id: '6f229db8-9631-4244-8b73-26c32129342b' },
        select: {
            id: true,
            name: true,
            googleCalendarEnabled: true,
            googleAccessToken: true,
            googleRefreshToken: true,
            googleTokenExpiry: true
        }
    });

    if (org) {
        console.log(`Organization: ${org.name}`);
        console.log(`- Google Calendar Enabled: ${org.googleCalendarEnabled}`);
        console.log(`- Has Access Token: ${!!org.googleAccessToken} (${org.googleAccessToken?.substring(0, 10)}...)`);
        console.log(`- Has Refresh Token: ${!!org.googleRefreshToken}`);
        console.log(`- Token Expiry: ${org.googleTokenExpiry}`);
    } else {
        console.log('Organization not found');
    }
}

check()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
