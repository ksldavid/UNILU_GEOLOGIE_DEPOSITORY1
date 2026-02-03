import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("🔗 Début de l'inscription automatique des étudiants aux cours...");

    // 1. Récupérer toutes les inscriptions en promotion (StudentEnrollment)
    const enrollments = await prisma.studentEnrollment.findMany({
        include: {
            academicLevel: {
                include: {
                    courses: true // On récupère les cours liés à ce niveau
                }
            }
        }
    });

    console.log(`📄 Analyse de ${enrollments.length} inscriptions en promotion...`);

    let totalEnrollmentsCreated = 0;

    for (const enrollment of enrollments) {
        const studentId = enrollment.userId;
        const courses = enrollment.academicLevel.courses;

        if (courses.length === 0) {
            console.warn(`⚠️  Aucun cours trouvé pour le niveau : ${enrollment.academicLevel.name}`);
            continue;
        }

        // Inscrire l'étudiant à chaque cours du niveau
        for (const course of courses) {
            try {
                await prisma.studentCourseEnrollment.upsert({
                    where: {
                        userId_courseCode_academicYear: {
                            userId: studentId,
                            courseCode: course.code,
                            academicYear: enrollment.academicYear
                        }
                    },
                    update: {
                        isActive: true
                    },
                    create: {
                        userId: studentId,
                        courseCode: course.code,
                        academicYear: enrollment.academicYear,
                        isActive: true
                    }
                });
                totalEnrollmentsCreated++;
            } catch (error: any) {
                console.error(`❌ Erreur d'inscription : Etudiant ${studentId} -> Cours ${course.code}`);
            }
        }
    }

    console.log(`\n✅ Opération terminée !`);
    console.log(`✨ ${totalEnrollmentsCreated} inscriptions cours-étudiants ont été créées.`);
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
