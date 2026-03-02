const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const userId = "0125010435"; // Harly's ID
        const student = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                studentEnrollments: {
                    include: { academicLevel: true },
                    orderBy: { enrolledAt: 'desc' },
                    take: 1
                },
                studentCourseEnrollments: {
                    where: { isActive: true },
                    include: { course: true }
                }
            }
        });

        const currentEnrollment = student.studentEnrollments[0];
        const currentLevelId = currentEnrollment?.academicLevelId;
        const levelName = currentEnrollment?.academicLevel?.name || 'Non défini';
        const activeCourseCodes = student.studentCourseEnrollments.map(e => e.courseCode);

        console.log('--- TEST DASHBOARD ---');
        console.log('Nom:', student.name);
        console.log('Level:', levelName);
        console.log('Course count:', student.studentCourseEnrollments.length);

        const courseStats = await Promise.all(
            student.studentCourseEnrollments.map(async (enrollment) => {
                const courseCode = enrollment.courseCode;

                // Get all sessions for this course
                const sessions = await prisma.attendanceSession.findMany({
                    where: { courseCode }
                });

                // Get student's attendance records for these sessions
                const records = await prisma.attendanceRecord.findMany({
                    where: {
                        studentId: userId,
                        sessionId: { in: sessions.map(s => s.id) }
                    }
                });

                const totalCount = sessions.length;
                const presentCount = records.filter(r => r.status === 'PRESENT').length;
                const lateCount = records.filter(r => r.status === 'LATE').length;
                const attendedCount = presentCount + (lateCount * 0.5);
                return {
                    id: courseCode,
                    totalCount,
                    attendedCount
                };
            })
        );

        console.log('Stats generated without error. Count:', courseStats.length);
    } catch (e) {
        console.error('Erreur:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
