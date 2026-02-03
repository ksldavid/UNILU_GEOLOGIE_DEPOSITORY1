
import prisma from './lib/prisma';

async function checkProf() {
    const profId = 'UNI0001';
    try {
        const assignments = await prisma.courseEnrollment.findMany({
            where: { userId: profId },
            include: {
                course: true
            }
        });

        if (assignments.length === 0) {
            console.log(`❌ Le professeur ${profId} n'a aucune assignation de cours.`);
        } else {
            console.log(`✅ Le professeur ${profId} est assigné aux cours suivants :`);
            assignments.forEach((a: any) => {
                console.log(`- [${a.courseCode}] ${a.course.name} (Rôle: ${a.role})`);
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: profId }
        });
        if (user) {
            console.log(`\nInfo Utilisateur: ${user.name} (${user.id})`);
        } else {
            console.log(`\nUtilisateur ${profId} introuvable dans la table User.`);
        }

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        process.exit();
    }
}

checkProf();
