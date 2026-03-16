
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const levels = await prisma.academicLevel.findMany({ 
        orderBy: { order: 'asc' }
    });
    levels.forEach(l => {
        console.log(`Order: ${l.order} | Code: ${l.code} | Name: ${l.name}`);
    });
}

main().finally(() => prisma.$disconnect());
