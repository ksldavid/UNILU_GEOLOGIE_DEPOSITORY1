const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetAttendance() {
    try {
        console.log('🗑️  Suppression de toutes les données de présence...\n');

        // 1. Supprimer tous les enregistrements de présence
        const deletedRecords = await prisma.attendanceRecord.deleteMany({});
        console.log(`✅ ${deletedRecords.count} enregistrements de présence supprimés`);

        // 2. Supprimer toutes les sessions de présence
        const deletedSessions = await prisma.attendanceSession.deleteMany({});
        console.log(`✅ ${deletedSessions.count} sessions de présence supprimées`);

        console.log('\n✨ Toutes les données de présence ont été supprimées avec succès !');
        console.log('📝 Vous pouvez maintenant recommencer de zéro.\n');

    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAttendance();
