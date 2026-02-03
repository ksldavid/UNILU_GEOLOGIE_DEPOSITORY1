const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupData() {
    try {
        console.log('🗑️  Suppression des données demandées...\n');

        // 1. Supprimer les demandes de changement de présence
        const deletedAttendanceRequests = await prisma.attendanceChangeRequest.deleteMany({});
        console.log(`✅ ${deletedAttendanceRequests.count} demandes de changement de présence supprimées`);

        // 2. Supprimer tous les enregistrements de présence
        const deletedRecords = await prisma.attendanceRecord.deleteMany({});
        console.log(`✅ ${deletedRecords.count} enregistrements de présence supprimés`);

        // 3. Supprimer toutes les sessions de présence
        const deletedSessions = await prisma.attendanceSession.deleteMany({});
        console.log(`✅ ${deletedSessions.count} sessions de présence supprimées`);

        // 4. Supprimer les accusés de lecture des annonces
        const deletedAnnouncementReads = await prisma.announcementRead.deleteMany({});
        console.log(`✅ ${deletedAnnouncementReads.count} accusés de lecture supprimés`);

        // 5. Supprimer toutes les annonces / communiqués
        const deletedAnnouncements = await prisma.announcement.deleteMany({});
        console.log(`✅ ${deletedAnnouncements.count} annonces supprimées`);

        console.log('\n✨ Nettoyage terminé avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupData();
