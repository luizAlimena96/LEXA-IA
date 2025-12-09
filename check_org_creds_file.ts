
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function check() {
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

    let output = '';
    if (org) {
        output += `Organization: ${org.name}\n`;
        output += `- Google Calendar Enabled: ${org.googleCalendarEnabled}\n`;
        output += `- Has Access Token: ${!!org.googleAccessToken} (${org.googleAccessToken?.substring(0, 10)}...)\n`;
        output += `- Has Refresh Token: ${!!org.googleRefreshToken}\n`;
        output += `- Token Expiry: ${org.googleTokenExpiry}\n`;
    } else {
        output += 'Organization not found\n';
    }

    fs.writeFileSync('creds_output.txt', output);
    console.log('Done writing to creds_output.txt');
}

check()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
