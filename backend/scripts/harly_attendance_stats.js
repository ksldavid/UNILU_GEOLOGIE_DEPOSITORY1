const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAttendance() {
    try {
        const studentId = '0125010435'; // Harly

        const result = await prisma.attendanceRecord.findMany({
            where: { studentId }
        });

        const statusCounts = {
            PRESENT: 0,
            ABSENT: 0,
            LATE: 0
        };

        result.forEach(record => {
            statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
        });

        const totalRecords = result.length;

        console.log('--- STATISTIQUES ASSIDUITÉ HARLY ---');
        console.log(`- Sessions enregistrées : ${totalRecords}`);
        console.log(`- PRESENT : ${statusCounts.PRESENT}`);
        console.log(`- LATE (En retard) : ${statusCounts.LATE}`);
        console.log(`- ABSENT (Ratées) : ${statusCounts.ABSENT}`);

    } catch (e) {
        console.error('Erreur:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkAttendance();
