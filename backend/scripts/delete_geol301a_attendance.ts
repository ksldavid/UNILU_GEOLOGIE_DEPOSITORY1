
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const courseCode = 'GEOL301A';
    const dateStr = '2026-02-13T00:00:00.000Z';
    const date = new Date(dateStr);

    console.log(`🔍 Recherche de la session de présence pour ${courseCode} le ${dateStr}...`);

    const session = await prisma.attendanceSession.findUnique({
        where: {
            courseCode_date: {
                courseCode: courseCode,
                date: date
            }
        }
    });

    if (!session) {
        console.log(`❌ Aucune session trouvée pour ${courseCode} le ${dateStr}.`);

        // Let's try to find sessions for this course on this day regardless of exact time
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const broaderSessions = await prisma.attendanceSession.findMany({
            where: {
                courseCode: courseCode,
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        if (broaderSessions.length > 0) {
            console.log(`⚠️ Trouvé ${broaderSessions.length} sessions via une recherche large :`);
            console.log(JSON.stringify(broaderSessions, null, 2));

            for (const s of broaderSessions) {
                await deleteSession(s.id);
            }
        } else {
            console.log("🤷‍♂️ Aucune session trouvée même avec une recherche large.");
        }
        return;
    }

    console.log(`✅ Session trouvée : ID ${session.id}. Suppression en cours...`);
    await deleteSession(session.id);
}

async function deleteSession(sessionId: number) {
    // 1. Supprimer les requêtes de modification liées aux records
    const records = await prisma.attendanceRecord.findMany({
        where: { sessionId: sessionId },
        select: { id: true }
    });

    const recordIds = records.map(r => r.id);

    if (recordIds.length > 0) {
        const deletedRequests = await prisma.attendanceChangeRequest.deleteMany({
            where: { attendanceId: { in: recordIds } }
        });
        console.log(`   - ${deletedRequests.count} requêtes de modification supprimées.`);
    }

    // 2. Supprimer les records
    const deletedRecords = await prisma.attendanceRecord.deleteMany({
        where: { sessionId: sessionId }
    });
    console.log(`   - ${deletedRecords.count} enregistrements de présence supprimés.`);

    // 3. Supprimer la session
    await prisma.attendanceSession.delete({
        where: { id: sessionId }
    });
    console.log(`   - Session ID ${sessionId} supprimée avec succès.`);
}

main()
    .catch(e => {
        console.error("❌ Erreur lors de l'exécution :", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
