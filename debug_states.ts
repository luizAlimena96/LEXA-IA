
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    const states = await prisma.state.findMany({
        where: {
            name: {
                contains: "AGENDAMENTO"
            }
        }
    });
    fs.writeFileSync('states_dump.json', JSON.stringify(states, null, 2));
    console.log("Dumped to states_dump.json");
}
main().catch(console.error).finally(async () => await prisma.$disconnect());
