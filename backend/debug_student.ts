
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function debug() {
    const studentId = "0125010731"; // Melardi Kashimbo Njima
    const student = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
            studentEnrollments: true,
            studentCourseEnrollments: true
        }
    })
    console.log('--- Student ' + studentId + ' ---')
    console.log(JSON.stringify(student, null, 2))

    if (student && student.studentEnrollments.length > 0) {
        const enrollment = student.studentEnrollments[0];
        const schedules = await prisma.schedule.findMany({
            where: {
                academicLevelId: enrollment.academicLevelId,
                academicYear: enrollment.academicYear,
                day: "Mardi"
            }
        })
        console.log('--- Schedules for Level ' + enrollment.academicLevelId + ' on Mardi ---')
        console.log(JSON.stringify(schedules, null, 2))
    }
}

debug()
