const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { id: 'UNI0001' },
                { email: 'uni0001@unilu.cd' }
            ]
        }
    });
    console.log(JSON.stringify(user, null, 2));
    process.exit(0);
}

checkUser().catch(err => {
    console.error(err);
    process.exit(1);
});
