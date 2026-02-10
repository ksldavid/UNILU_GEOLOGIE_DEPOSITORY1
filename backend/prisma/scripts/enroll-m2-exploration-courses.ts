
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const levelCode = 'm2_exploration' // Code as defined in import-m2-exploration.ts
    const academicYear = '2025-2026'

    console.log(`🚀 Assignation des cours pour le niveau : ${levelCode} (${academicYear})`)

    // 1. Get the academic level
    const academicLevel = await prisma.academicLevel.findFirst({
        where: { code: levelCode }
    })

    if (!academicLevel) {
        console.error(`❌ Niveau académique ${levelCode} introuvable.`)
        return
    }

    console.log(`✅ Niveau trouvé : ${academicLevel.displayName}`)

    // 2. Get all students enrolled in this level for this year
    const enrollments = await prisma.studentEnrollment.findMany({
        where: {
            academicLevelId: academicLevel.id,
            academicYear: academicYear
        },
        include: {
            user: true
        }
    })

    if (enrollments.length === 0) {
        console.warn(`⚠️  Aucun étudiant inscrit dans ce niveau pour l'année ${academicYear}.`)
        return
    }

    console.log(`👥 ${enrollments.length} étudiants trouvés.`)

    // 3. Get all courses for this level
    const courses = await prisma.course.findMany({
        where: {
            academicLevels: {
                some: {
                    id: academicLevel.id
                }
            }
        }
    })

    if (courses.length === 0) {
        console.warn(`⚠️  Aucun cours associé à ce niveau.`)
        return
    }

    console.log(`📚 ${courses.length} cours trouvés pour ce niveau.`)

    let totalEnrollments = 0
    let errors = 0

    // 4. Enroll each student in each course
    for (const enrollment of enrollments) {
        const student = enrollment.user
        console.log(`   👤 Traitement de : ${student.name} (${student.id})`)

        for (const course of courses) {
            try {
                await prisma.studentCourseEnrollment.upsert({
                    where: {
                        userId_courseCode_academicYear: {
                            userId: student.id,
                            courseCode: course.code,
                            academicYear: academicYear
                        }
                    },
                    update: {}, // No update needed if already exists
                    create: {
                        userId: student.id,
                        courseCode: course.code,
                        academicYear: academicYear,
                        isActive: true
                    }
                })
                // console.log(`      ✅ Inscrit au cours : ${course.name}`)
                totalEnrollments++
            } catch (error: any) {
                console.error(`      ❌ Erreur inscription ${course.code}: ${error.message}`)
                errors++
            }
        }
    }

    console.log(`\n✨ TERMINE !`)
    console.log(`✅ ${totalEnrollments} inscriptions aux cours vérifiées/effectuées.`)
    if (errors > 0) console.log(`❌ ${errors} erreurs rencontrées.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
