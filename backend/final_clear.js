
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('NETTOYAGE COMPLET DES DONNÉES DE TEST...');

    // On met tout à null pour TOUS les étudiants
    const result = await prisma.user.updateMany({
        where: { systemRole: 'STUDENT' },
        data: {
            sex: null,
            birthday: null,
            nationality: null
        }
    });

    console.log(`✅ Succès : ${result.count} étudiants remis à zéro (N/A).`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
