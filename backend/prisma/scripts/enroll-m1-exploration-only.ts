import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const levelCode = 'm1_exploration';
    const academicYear = '2025-2026';

    console.log(`🔗 Inscription ciblée pour : Master 1 Exploration Minière (${levelCode})`);

    // 1. Trouver le niveau académique
    const level = await prisma.academicLevel.findUnique({
        where: { code: levelCode },
        include: {
            courses: true
        }
    });

    if (!level) {
        console.error(`❌ Niveau académique ${levelCode} non trouvé.`);
        return;
    }

    if (level.courses.length === 0) {
        console.warn(`⚠️ Aucun cours trouvé pour le niveau ${level.name}.`);
        return;
    }

    console.log(`📚 ${level.courses.length} cours trouvés pour ce niveau.`);

    // 2. Récupérer les inscriptions en promotion pour ce niveau
    const studentEnrollments = await prisma.studentEnrollment.findMany({
        where: {
            academicLevelId: level.id,
            academicYear: academicYear
        },
        include: {
            user: true
        }
    });

    console.log(`👤 ${studentEnrollments.length} étudiants trouvés à inscrire.`);

    let totalEnrollmentsCreated = 0;

    for (const enrollment of studentEnrollments) {
        console.log(`   Traitement de : ${enrollment.user.name} (${enrollment.userId})`);

        for (const course of level.courses) {
            try {
                await prisma.studentCourseEnrollment.upsert({
                    where: {
                        userId_courseCode_academicYear: {
                            userId: enrollment.userId,
                            courseCode: course.code,
                            academicYear: academicYear
                        }
                    },
                    update: { isActive: true },
                    create: {
                        userId: enrollment.userId,
                        courseCode: course.code,
                        academicYear: academicYear,
                        isActive: true
                    }
                });
                totalEnrollmentsCreated++;
            } catch (error: any) {
                console.error(`      ❌ Erreur pour ${course.code}: ${error.message}`);
            }
        }
    }

    console.log(`\n✅ Opération terminée !`);
    console.log(`✨ ${totalEnrollmentsCreated} inscriptions cours-étudiants créées/mises à jour pour Master 1 Exploration.`);
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
