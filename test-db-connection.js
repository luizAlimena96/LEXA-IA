const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
    try {
        console.log('🔍 Testing database connection...\n');

        // Test connection
        await prisma.$connect();
        console.log('✅ Connected to database successfully!\n');

        // Test fetching users
        console.log('👥 Fetching users from database...');
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                password: true, // Include to verify it exists
            },
            take: 5,
        });

        if (users.length === 0) {
            console.log('⚠️  NO USERS FOUND!\n');
        } else {
            console.log(`✅ Found ${users.length} user(s):\n`);
            users.forEach((user) => {
                console.log(`- ${user.name} (${user.email})`);
                console.log(`  Role: ${user.role}`);
                console.log(`  Has password: ${user.password ? 'YES (hash: ' + user.password.substring(0, 20) + '...)' : 'NO'}`);
                console.log('');
            });
        }

        // Test fetching organizations
        console.log('🏢 Fetching organizations...');
        const orgs = await prisma.organization.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
            },
            take: 5,
        });

        if (orgs.length === 0) {
            console.log('⚠️  NO ORGANIZATIONS FOUND!\n');
        } else {
            console.log(`✅ Found ${orgs.length} organization(s):\n`);
            orgs.forEach((org) => {
                console.log(`- ${org.name} (${org.slug})`);
                console.log(`  Active: ${org.isActive}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        if (error.code) {
            console.error('   Error Code:', error.code);
        }
        console.error('\n   Full error:', error);
    } finally {
        await prisma.$disconnect();
        console.log('\n✅ Database connection closed.');
    }
}

testConnection();
