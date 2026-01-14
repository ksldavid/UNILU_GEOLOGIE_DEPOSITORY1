
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function debug() {
    const users = await prisma.user.findMany({
        where: { systemRole: 'STUDENT' },
        include: {
            studentEnrollments: true,
            studentCourseEnrollments: true
        },
        take: 5
    })
    console.log('--- Students ---')
    console.log(JSON.stringify(users, null, 2))

    const schedules = await prisma.schedule.findMany({
        take: 20
    })
    console.log('--- Schedules ---')
    console.log(JSON.stringify(schedules, null, 2))

    const levels = await prisma.academicLevel.findMany()
    console.log('--- Levels ---')
    console.log(JSON.stringify(levels, null, 2))
}

debug()
