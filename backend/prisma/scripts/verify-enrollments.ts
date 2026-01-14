
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const student = await prisma.user.findFirst({
        where: { name: { contains: 'BULOBO' } },
        include: {
            studentCourseEnrollments: {
                include: { course: true }
            }
        }
    })

    if (student) {
        console.log(`Étudiant: ${student.name}`)
        console.log(`Nombre de cours inscrits: ${student.studentCourseEnrollments.length}`)
        student.studentCourseEnrollments.forEach(e => {
            console.log(`- ${e.courseCode}: ${e.course.name}`)
        })
    } else {
        console.log("Étudiant non trouvé")
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
