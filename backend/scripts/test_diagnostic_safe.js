const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDiagnosticSupportTicket() {
    try {
        console.log('--- TEST BACKEND DIAGNOSTIC (SUPPORT TICKET) ---');
        
        // Mock data
        const userId = '0125010435'; // Harly
        
        // 1. Fetch student info
        const user = await prisma.user.findUnique({ where: { id: userId } });
        console.log('User found:', user.name);

        // 2. Create Support Ticket (GPS Diagnostic)
        const ticket = await prisma.supportTicket.create({
            data: {
                subject: 'DIAGNOSTIC_GPS',
                category: 'SUPPORT_TECHNIQUE',
                priority: 'LOW',
                status: 'CLOSED',
                userId: userId,
                metadata: {
                    studentName: user.name,
                    receivedLat: -11.6163,
                    receivedLng: 27.4789,
                    distanceKm: 0,
                    onCampus: true,
                    tokenRemainingSeconds: 3600,
                    tokenExpired: false
                }
            }
        });
        console.log('Support Ticket created as GPS log. ID:', ticket.id);

        // 3. Verify retrieval
        const tickets = await prisma.supportTicket.findMany({
            where: { subject: 'DIAGNOSTIC_GPS' },
            orderBy: { createdAt: 'desc' },
            take: 1
        });
        console.log('Ticket retrieved. Metadata studentName:', tickets[0].metadata.studentName);

        console.log('--- TEST RÉUSSI (100% SAFE) ---');

    } catch (e) {
        console.error('ERREUR TEST:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

testDiagnosticSupportTicket();
