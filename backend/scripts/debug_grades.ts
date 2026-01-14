import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const gradesCount = await prisma.grade.count()
    console.log('Total Grades:', gradesCount)

    const grades = await prisma.grade.findMany({
        take: 5,
        include: { student: { select: { name: true } }, assessment: true }
    })
    console.log('Grades:', JSON.stringify(grades, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
