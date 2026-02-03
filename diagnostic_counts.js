const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const total = await prisma.user.count();
    const students = await prisma.user.count({ where: { systemRole: 'STUDENT' } });
    const profs = await prisma.user.count({ where: { professorProfile: { isNot: null } } });
    const staff = await prisma.user.count({ where: { systemRole: 'ACADEMIC_OFFICE' } });
    const admin = await prisma.user.count({ where: { systemRole: 'ADMIN' } });
    const archived = await prisma.user.count({ where: { isArchived: true } });

    const courseEnrollments = await prisma.studentCourseEnrollment.count();
    const yearlyEnrollments = await prisma.studentEnrollment.count();

    console.log({
        total,
        students,
        profs,
        staff,
        admin,
        archived,
        courseEnrollments,
        yearlyEnrollments
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
