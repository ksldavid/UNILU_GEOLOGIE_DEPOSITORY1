import prisma from './src/lib/prisma';

async function listProfs() {
    const users = await prisma.user.findMany({
        where: { systemRole: 'USER' },
        select: { id: true, name: true, email: true }
    });
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
}

listProfs().catch(err => {
    console.error(err);
    process.exit(1);
});
