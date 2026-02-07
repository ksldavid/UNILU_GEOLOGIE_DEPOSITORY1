
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const count = await prisma.attendanceRecord.count()
    console.log(`Total Attendance Records: ${count}`)

    if (count > 0) {
        const all = await prisma.attendanceRecord.findMany({
            take: 20,
            include: {
                student: { select: { name: true } }
            }
        })
        console.log('Sample records:', JSON.stringify(all, null, 2))
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
