
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const courses = await prisma.course.findMany({ 
        select: { code: true, name: true }
    });
    console.log(JSON.stringify(courses, null, 2));
}
main().finally(() => prisma.$disconnect());
