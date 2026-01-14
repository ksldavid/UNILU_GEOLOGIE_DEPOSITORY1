const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAcadUser() {
    const user = await prisma.user.findFirst({
        where: { id: 'ACAD-001' }
    });
    console.log(JSON.stringify(user, null, 2));
    process.exit(0);
}

checkAcadUser().catch(err => {
    console.error(err);
    process.exit(1);
});
