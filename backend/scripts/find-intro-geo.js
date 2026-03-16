
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const course = await prisma.course.findFirst({ 
        where: { name: { contains: 'Introduction à la géophysique', mode: 'insensitive' } },
        include: { academicLevels: true }
    });
    console.log(JSON.stringify(course, null, 2));
}
main().finally(() => prisma.$disconnect());
