
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.courseEnrollment.count();
    console.log('Total Assignments in DB:', count);

    const sample = await prisma.courseEnrollment.findFirst({
        include: { user: true, course: true }
    });
    console.log('Sample Assignment:', JSON.stringify(sample, null, 2));

    const batumike = await prisma.user.findFirst({
        where: { name: { contains: 'BATUMIKE' } }
    });
    console.log('Batumike User:', JSON.stringify(batumike, null, 2));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
}).finally(() => prisma.$disconnect());
