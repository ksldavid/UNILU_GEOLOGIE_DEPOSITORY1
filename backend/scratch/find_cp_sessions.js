const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== SESSIONS CRÉÉES PAR UN CP (createdByCP = true) ===\n');

  const cpSessions = await prisma.attendanceSession.findMany({
    where: { createdByCP: true },
    include: {
      course: { select: { name: true, code: true } },
      _count: { select: { records: true } }
    },
    orderBy: { date: 'desc' }
  });

  if (cpSessions.length === 0) {
    console.log('❌ Aucune session trouvée avec createdByCP = true.');
    console.log('');
    console.log('RAISON : La colonne "createdByCP" a été ajoutée à la base de données');
    console.log('aujourd\'hui (16 mai 2026). Toutes les sessions créées AVANT aujourd\'hui');
    console.log('ont automatiquement reçu la valeur "false" par défaut.');
    console.log('');
    console.log('Le label "prise par le CP" ne fonctionnera donc que pour les');
    console.log('sessions créées APRÈS ce changement.');
  } else {
    for (const s of cpSessions) {
      console.log(`✅ ${s.course.name} (${s.course.code})`);
      console.log(`   Date: ${s.date.toISOString().split('T')[0]}`);
      console.log(`   Session: ${s.sessionNumber}`);
      console.log(`   Présences enregistrées: ${s._count.records}`);
      console.log('---');
    }
  }

  console.log('\n=== TOUS LES CPs DE BAC 3 ===\n');

  const allCPs = await prisma.user.findMany({
    where: { isChefDePromo: true },
    include: {
      studentEnrollments: {
        include: { academicLevel: { select: { name: true } } }
      }
    }
  });

  for (const cp of allCPs) {
    const level = cp.studentEnrollments[0]?.academicLevel?.name || 'Inconnu';
    console.log(`CP: ${cp.name} (ID: ${cp.id}) → Niveau: ${level}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
