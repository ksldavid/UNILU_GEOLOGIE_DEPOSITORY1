const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupAttendanceForNewSemester() {
    const cutOffDate = new Date('2026-04-13T00:00:00Z');
    
    console.log(`🧹 Nettoyage des présences avant le ${cutOffDate.toLocaleDateString()}...`);

    try {
        // 1. Compter d'abord pour info
        const sessionsToBatch = await prisma.attendanceSession.findMany({
            where: {
                date: {
                    lt: cutOffDate
                }
            },
            select: { id: true }
        });

        const sessionIds = sessionsToBatch.map(s => s.id);

        if (sessionIds.length === 0) {
            console.log('✅ Aucune ancienne présence trouvée. La base est déjà propre !');
            return;
        }

        console.log(`📊 Trouvé : ${sessionIds.length} sessions à supprimer.`);

        // 2. Supprimer les records liés à ces sessions
        const deletedRecords = await prisma.attendanceRecord.deleteMany({
            where: {
                sessionId: {
                    in: sessionIds
                }
            }
        });
        console.log(`✅ ${deletedRecords.count} enregistrements de présence supprimés.`);

        // 3. Supprimer les sessions
        const deletedSessions = await prisma.attendanceSession.deleteMany({
            where: {
                id: {
                    in: sessionIds
                }
            }
        });
        console.log(`✅ ${deletedSessions.count} sessions de présence supprimées.`);

        console.log('\n✨ Opération terminée avec succès ! Le nouveau semestre commence sur de bonnes bases.');

    } catch (error) {
        console.error('❌ Erreur lors du nettoyage :', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupAttendanceForNewSemester();
