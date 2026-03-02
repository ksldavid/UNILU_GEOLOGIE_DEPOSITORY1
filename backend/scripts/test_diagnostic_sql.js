const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDiagnosticBackend() {
    try {
        console.log('--- TEST BACKEND DIAGNOSTIC ---');
        
        // Mock data
        const userId = '0125010435'; // Harly
        const lat = -11.6163; // Exact campus lat
        const lng = 27.4789; // Exact campus lng
        
        // 1. Fetch student info
        const user = await prisma.user.findUnique({ where: { id: userId } });
        console.log('User found:', user.name);

        // 2. Simulate table creation (if not exists)
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "LocationDiagnostic" (
                "id"                    SERIAL PRIMARY KEY,
                "userId"                TEXT NOT NULL,
                "studentName"           TEXT NOT NULL,
                "studentCode"           TEXT NOT NULL,
                "receivedLat"           DOUBLE PRECISION NOT NULL,
                "receivedLng"           DOUBLE PRECISION NOT NULL,
                "accuracy"              DOUBLE PRECISION,
                "distanceKm"            DOUBLE PRECISION NOT NULL,
                "onCampus"              BOOLEAN NOT NULL,
                "tokenExpiresAt"        TIMESTAMPTZ,
                "tokenRemainingSeconds" INTEGER,
                "tokenExpired"          BOOLEAN NOT NULL DEFAULT false,
                "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table checked/created safely.');

        // 3. Insert mock diagnostic
        await prisma.$executeRawUnsafe(
            `INSERT INTO "LocationDiagnostic" 
            ("userId", "studentName", "studentCode", "receivedLat", "receivedLng", "accuracy", "distanceKm", "onCampus", "tokenExpired")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            userId, user.name, userId, lat, lng, 10, 0, true, false
        );
        console.log('Mock diagnostic inserted.');

        // 4. Verify insertion
        const logs = await prisma.$queryRawUnsafe(`SELECT * FROM "LocationDiagnostic" WHERE "userId" = $1 ORDER BY "id" DESC LIMIT 1`, userId);
        console.log('Log retrieved:', logs[0].studentName, 'Distance:', logs[0].distanceKm, 'km');

        console.log('--- TEST RÉUSSI ---');

    } catch (e) {
        console.error('ERREUR TEST:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

testDiagnosticBackend();
