
// ─── DIAGNOSTIC: Login Problems ───────────────────────────────────────────────
// Run: node scripts/diagnose_login.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Test credentials from the screenshots
const testCases = [
    { id: '0125010435', password: 'HAR37881', type: 'STUDENT' },
    { id: 'M00866040',  password: 'sunmyongmoon1920', type: 'ADMIN' },
];

async function diagnose() {
    console.log('\n========================================');
    console.log('  DIAGNOSTIC CONNEXION UNILU PORTAIL');
    console.log('========================================\n');

    // 1. Check if DB is reachable
    try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ [DB] Connexion PostgreSQL/Prisma Accelerate OK\n');
    } catch (e) {
        console.error('❌ [DB] IMPOSSIBLE DE JOINDRE LA BASE DE DONNÉES');
        console.error('   Raison:', e.message);
        process.exit(1);
    }

    // 2. Count users in the system
    const totalUsers = await prisma.user.count();
    console.log(`📊 [DB] Nombre total d'utilisateurs en base : ${totalUsers}`);

    const blockedUsers = await prisma.user.count({ where: { isBlocked: true } });
    console.log(`🚫 [DB] Utilisateurs bloqués : ${blockedUsers}\n`);

    // 3. Check each test case
    for (const tc of testCases) {
        console.log(`─── Test: [${tc.type}] identifiant = "${tc.id}" ───`);
        
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: tc.id },
                    { id: tc.id }
                ]
            }
        });

        if (!user) {
            console.log(`  ❌ UTILISATEUR INTROUVABLE en base`);
            console.log(`     → Il n'existe aucun compte avec l'id/email "${tc.id}"`);
            
            // Try to find similar IDs
            const similar = await prisma.user.findMany({
                where: { id: { contains: tc.id.substring(0, 5) } },
                select: { id: true, name: true, systemRole: true },
                take: 3
            });
            if (similar.length > 0) {
                console.log(`     → IDs similaires trouvés :`);
                similar.forEach(s => console.log(`        - ${s.id} | ${s.name} | ${s.systemRole}`));
            }
        } else {
            console.log(`  ✅ Utilisateur trouvé : ${user.name} | Rôle: ${user.systemRole}`);
            console.log(`     isBlocked: ${user.isBlocked}`);
            console.log(`     deletedAt: ${user.deletedAt || 'null (actif)'}`);
            
            // Check password
            const isPasswordValid = await bcrypt.compare(tc.password, user.password);
            if (isPasswordValid) {
                console.log(`  ✅ MOT DE PASSE CORRECT → La connexion devrait marcher`);
            } else {
                console.log(`  ❌ MOT DE PASSE INCORRECT`);
                console.log(`     → Le hash stocké commence par: ${user.password.substring(0, 20)}...`);
                console.log(`     → Vérifiez que le mot de passe n'a pas été changé`);
            }
        }
        console.log();
    }

    // 4. Check JWT secret
    console.log('─── Vérification JWT ───');
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.log('  ❌ JWT_SECRET est VIDE dans .env → Les tokens ne peuvent pas être signés!');
    } else {
        console.log(`  ✅ JWT_SECRET est configuré (longueur: ${jwtSecret.length} chars)`);
    }

    // 5. Check for soft-deleted users with matching IDs
    console.log('\n─── Utilisateurs avec deletedAt (compte supprimé/archivé) ───');
    const deleted = await prisma.user.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, name: true, systemRole: true, deletedAt: true },
        take: 5
    });
    if (deleted.length > 0) {
        console.log(`  ⚠️  ${deleted.length} utilisateurs soft-deleted trouvés :`);
        deleted.forEach(d => console.log(`     - ${d.id} | ${d.name} | supprimé le ${d.deletedAt}`));
    } else {
        console.log('  ✅ Aucun utilisateur soft-deleted');
    }

    // 6. Sample a few real users to show (to verify data integrity)
    console.log('\n─── Échantillon de 5 utilisateurs réels (pour vérification) ───');
    const sample = await prisma.user.findMany({
        select: { id: true, name: true, systemRole: true, isBlocked: true },
        take: 5
    });
    sample.forEach(u => {
        console.log(`  ${u.isBlocked ? '🔴' : '🟢'} [${u.systemRole}] ${u.id} | ${u.name}`);
    });

    console.log('\n========================================');
    console.log('  FIN DU DIAGNOSTIC');
    console.log('========================================\n');
    
    await prisma.$disconnect();
}

diagnose().catch(async (e) => {
    console.error('Erreur fatale:', e);
    await prisma.$disconnect();
    process.exit(1);
});
