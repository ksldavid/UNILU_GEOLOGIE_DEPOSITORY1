import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const sessionsCount = await prisma.attendanceSession.count()
    console.log('Total Sessions:', sessionsCount)

    const sessions = await prisma.attendanceSession.findMany({
        include: { _count: { select: { records: true } } }
    })
    console.log('Sessions:', JSON.stringify(sessions, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
