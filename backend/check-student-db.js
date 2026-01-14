
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const user = await prisma.user.findFirst({
        where: { idNumber: '0125011413' }
    });
    console.log('User found:', user);
    process.exit(0);
}

check();
