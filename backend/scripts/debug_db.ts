import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const sessions = await prisma.attendanceSession.findMany({
        take: 5,
        include: { course: true }
    })
    console.log('Sessions:', JSON.stringify(sessions, null, 2))

    const courses = await prisma.course.findMany({ take: 5 })
    console.log('Courses:', JSON.stringify(courses, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
