const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const userId = "0125010435"; // Harly's ID

        // Test getStudentCourses query
        const student = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                studentEnrollments: {
                    include: { academicLevel: true },
                    orderBy: { enrolledAt: 'desc' },
                    take: 1
                }
            }
        });

        const enrollments = await prisma.studentCourseEnrollment.findMany({
            where: {
                userId,
                isActive: true
            },
            include: {
                course: {
                    include: {
                        enrollments: {
                            where: { role: 'PROFESSOR' },
                            include: { user: true },
                            take: 1
                        },
                        schedules: {
                            orderBy: { day: 'asc' }
                        },
                        _count: {
                            select: { resources: true }
                        },
                        assessments: {
                            where: {
                                type: { in: ['TP', 'TD'] },
                                submissions: {
                                    none: { studentId: userId }
                                },
                                OR: [
                                    { dueDate: null },
                                    { dueDate: { gt: new Date() } }
                                ]
                            }
                        },
                        attendanceSessions: {
                            include: {
                                records: {
                                    where: { studentId: userId }
                                }
                            }
                        }
                    }
                }
            }
        });

        console.log('--- TEST API ---');
        console.log('Student Level:', student.studentEnrollments[0]?.academicLevel?.name);
        console.log('Courses Count:', enrollments.length);
        if (enrollments.length > 0) {
            console.log('First Course:', enrollments[0].course.code, enrollments[0].course.name);
        }
    } catch (e) {
        console.error('Erreur:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
