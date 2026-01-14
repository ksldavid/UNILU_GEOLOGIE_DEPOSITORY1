
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const levels = await prisma.academicLevel.findMany({
        include: {
            _count: {
                select: { studentEnrollments: true }
            }
        },
        orderBy: { order: 'asc' }
    })

    console.log("📊 ÉTUDIANTS PAR NIVEAU :")
    levels.forEach(l => {
        console.log(`${l.code.padEnd(20)}: ${l._count.studentEnrollments} étudiants`)
    })

    const total = await prisma.user.count({ where: { systemRole: 'STUDENT' } })
    console.log(`\nTOTAL UNIQUE STUDENTS: ${total}`)
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
