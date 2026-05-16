
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testReducedQuery() {
    try {
        console.log("Testing reduced getUsers query (no _count)...");
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                systemRole: true,
                createdAt: true,
                isBlocked: true,
                isChefDePromo: true,
                profilePhotoUrl: true,
                studentEnrollments: {
                    take: 1,
                    orderBy: { enrolledAt: 'desc' },
                    select: { academicLevel: { select: { name: true } } }
                },
                studentCourseEnrollments: {
                    select: {
                        course: {
                            select: {
                                name: true, code: true, isCompleted: true
                                // _count REMOVED
                            }
                        }
                    }
                },
                enrollments: {
                    select: {
                        role: true, academicYear: true,
                        course: {
                            select: {
                                code: true, name: true,
                                academicLevels: { select: { displayName: true, code: true } }
                            }
                        }
                    }
                },
                professorProfile: { select: { title: true } },
                academicProfile: { select: { name: true, title: true } }
            },
            orderBy: { name: 'asc' }
        });
        
        const students = users.filter(u => u.systemRole === 'STUDENT');
        console.log(`\n✅ Query SUCCESS!`);
        console.log(`Total users: ${users.length}`);
        console.log(`Students: ${students.length}`);
    } catch (error) {
        console.error("❌ QUERY FAILED:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testReducedQuery();
