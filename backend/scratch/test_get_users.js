
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testGetUsers() {
    try {
        console.log("Testing getUsers query...");
        const users = await prisma.user.findMany({
            where: { systemRole: 'STUDENT' },
            select: {
                id: true,
                name: true,
                systemRole: true,
                studentCourseEnrollments: {
                    select: {
                        course: {
                            select: {
                                name: true, code: true, isCompleted: true,
                                _count: { select: { attendanceSessions: true } }
                            }
                        }
                    }
                }
            },
            take: 5
        });
        console.log("Success! Found users:", users.length);
        if (users.length > 0) {
            console.log("First user enrollments sample:", JSON.stringify(users[0].studentCourseEnrollments, null, 2));
        }
    } catch (error) {
        console.error("FAILED to fetch users:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testGetUsers();
