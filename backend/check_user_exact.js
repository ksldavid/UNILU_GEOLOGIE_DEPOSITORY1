const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserExact() {
    const user = await prisma.user.findFirst({
        where: { id: 'UNI0001' }
    });
    if (user) {
        console.log('ID:', JSON.stringify(user.id));
        console.log('ID Length:', user.id.length);
        console.log('Email:', JSON.stringify(user.email));
    } else {
        console.log('User not found by ID UNI0001');
    }
    process.exit(0);
}

checkUserExact().catch(err => {
    console.error(err);
    process.exit(1);
});
