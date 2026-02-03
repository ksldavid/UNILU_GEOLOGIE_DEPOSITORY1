import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const recordsCount = await prisma.attendanceRecord.count()
    console.log('Total Attendance Records:', recordsCount)

    const records = await prisma.attendanceRecord.findMany({
        take: 5,
        include: { student: { select: { name: true } } }
    })
    console.log('Records:', JSON.stringify(records, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
