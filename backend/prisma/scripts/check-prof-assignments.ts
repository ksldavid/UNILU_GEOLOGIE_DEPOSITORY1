import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const enrollments = await prisma.courseEnrollment.findMany({
        include: {
            user: { select: { name: true, id: true } },
            course: { select: { name: true, code: true } }
        }
    })
    console.log(`\n🔍 Vérification des Affectations Professeurs :`)
    console.log(`Total: ${enrollments.length}`)
    enrollments.forEach(e => {
        console.log(`- ${e.user.name} (${e.userId}) enseigne ${e.course.name} (${e.courseCode}) [${e.role}] - Année ${e.academicYear}`)
    })
}

main().catch(console.error).finally(() => prisma.$disconnect())
