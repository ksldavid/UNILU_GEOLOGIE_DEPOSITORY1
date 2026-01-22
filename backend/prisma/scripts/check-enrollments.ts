
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const enrollmentsCount = await prisma.studentEnrollment.count()
        const studentCoursesCount = await prisma.studentCourseEnrollment.count()
        const studentsCount = await prisma.user.count({ where: { systemRole: 'STUDENT' } })

        console.log(`\n📊 DIAGNOSTIC RAPIDE :`)
        console.log(`-----------------------`)
        console.log(`👥 Étudiants (User)          : ${studentsCount}`)
        console.log(`📛 Inscriptions Classe (StudentEnrollment) : ${enrollmentsCount}`)
        console.log(`📚 Inscriptions Cours (StudentCourseEnrollment) : ${studentCoursesCount}`)

        if (enrollmentsCount === 0) {
            console.log("\n⚠️  StudentEnrollment est VIDE ! Cela veut dire que les étudiants sont créés mais pas liés à leur niveau (B1, M1, etc).")
        } else {
            console.log("\n✅ StudentEnrollment n'est pas vide.")
            // Afficher quelques exemples
            const examples = await prisma.studentEnrollment.findMany({
                take: 3,
                include: { user: true, academicLevel: true }
            })
            console.log("Exemples :", examples.map(e => `${e.user.name} -> ${e.academicLevel.code}`))
        }

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
