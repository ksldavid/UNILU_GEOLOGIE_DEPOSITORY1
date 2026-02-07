const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fullReset() {
    try {
        console.log('🚀 Démarrage du nettoyage complet de la base de données pour le lancement...\n');

        // --- 1. SUPPORT & COMMUNICATIONS ---
        console.log('📬 Nettoyage des communications...');
        await prisma.supportMessage.deleteMany({});
        await prisma.supportTicket.deleteMany({});
        await prisma.notification.deleteMany({});
        console.log('  ✅ Messages de support, tickets et notifications supprimés');

        // --- 2. ANNONCES & ACCUSÉS ---
        console.log('📢 Nettoyage des annonces...');
        await prisma.announcementRead.deleteMany({});
        await prisma.announcement.deleteMany({});
        console.log('  ✅ Annonces et accusés de lecture supprimés');

        // --- 3. PRÉSENCES ---
        console.log('📝 Nettoyage des présences...');
        await prisma.attendanceChangeRequest.deleteMany({});
        await prisma.attendanceRecord.deleteMany({});
        await prisma.attendanceSession.deleteMany({});
        console.log('  ✅ Toutes les données de présence supprimées');

        // --- 4. NOTES & DEVOIRS ---
        console.log('🎓 Nettoyage des notes et évaluations...');
        await prisma.gradeChangeRequest.deleteMany({});
        await prisma.grade.deleteMany({});
        await prisma.submission.deleteMany({});
        await prisma.assessment.deleteMany({});
        console.log('  ✅ Évaluations, soumissions et notes supprimées');

        // --- 5. RESSOURCES & HORAIRES ---
        console.log('📅 Nettoyage des ressources et horaires...');
        await prisma.courseResource.deleteMany({});
        await prisma.schedule.deleteMany({});
        await prisma.courseRetake.deleteMany({});
        console.log('  ✅ PDF de cours, horaires et inscriptions aux recours supprimés');

        // --- 6. PUBLICITÉS ---
        console.log('📺 Nettoyage des publicités...');
        await prisma.advertisement.deleteMany({});
        console.log('  ✅ Publicités de test supprimées');

        // --- 7. RÉINITIALISATION DES PROFILS ÉTUDIANTS (Optionnel) ---
        console.log('👤 Réinitialisation des profils étudiants...');
        const result = await prisma.user.updateMany({
            where: { systemRole: 'STUDENT' },
            data: {
                sex: null,
                birthday: null,
                nationality: null,
                isBlocked: false,
                blockReason: null
            }
        });
        console.log(`  ✅ ${result.count} profils étudiants réinitialisés (données N/A)`);

        console.log('\n✨ NETTOYAGE TERMINÉ AVEC SUCCÈS ! ✨');
        console.log('Le site est maintenant prêt pour une utilisation officielle par les étudiants.');

    } catch (error) {
        console.error('\n❌ ERREUR LORS DU NETTOYAGE :', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Confirmation avant exécution si lancé via terminal
fullReset();
