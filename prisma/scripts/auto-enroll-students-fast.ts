import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("🚀 Lancement de l'inscription ULTRA-RAPIDE des étudiants aux cours...");

    // 1. Récupérer toutes les inscriptions en promotion (StudentEnrollment)
    const enrollments = await prisma.studentEnrollment.findMany({
        include: {
            academicLevel: {
                include: {
                    courses: true
                }
            }
        }
    });

    console.log(`📄 Analyse de ${enrollments.length} inscriptions en promotion...`);

    const dataToInsert: any[] = [];

    for (const enrollment of enrollments) {
        const studentId = enrollment.userId;
        const courses = enrollment.academicLevel.courses;

        for (const course of courses) {
            dataToInsert.push({
                userId: studentId,
                courseCode: course.code,
                academicYear: enrollment.academicYear,
                isActive: true
            });
        }
    }

    console.log(`📡 Préparation de ${dataToInsert.length} inscriptions aux cours...`);

    // Utilisation de createMany pour une insertion massive super rapide
    // skipDuplicates: true permet d'ignorer ceux qui sont déjà inscrits
    const result = await prisma.studentCourseEnrollment.createMany({
        data: dataToInsert,
        skipDuplicates: true,
    });

    console.log(`\n✅ Opération terminée !`);
    console.log(`✨ ${result.count} nouvelles inscriptions ont été créées.`);

    const finalCount = await prisma.studentCourseEnrollment.count();
    console.log(`📊 Total actuel dans la base : ${finalCount} inscriptions.`);
}

main()
    .catch((e) => {
        console.error("❌ Erreur pendant l'auto-inscription:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
