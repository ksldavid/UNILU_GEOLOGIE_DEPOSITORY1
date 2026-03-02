const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findCulprit() {
    const models = [
        'user',
        'academicLevel',
        'studentEnrollment',
        'professorProfile',
        'adminProfile',
        'academicProfile',
        'course',
        'courseEnrollment',
        'studentCourseEnrollment',
        'assessment',
        'submission',
        'grade',
        'gradeChangeRequest',
        'attendanceSession',
        'attendanceRecord',
        'attendanceChangeRequest',
        'courseResource',
        'announcement',
        'announcementRead',
        'schedule',
        'examSchedule',
        'advertisement'
    ];

    for (const model of models) {
        try {
            process.stdout.write(`Testing model ${model}... `);
            await prisma[model].findFirst();
            process.stdout.write('OK\n');
        } catch (e) {
            process.stdout.write(`FAILED: ${e.message}\n`);
        }
    }
    await prisma.$disconnect();
}

findCulprit();
