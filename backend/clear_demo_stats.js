
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Clearing demo statistics (gender, birthDate, nationality) for all students...');

    const result = await prisma.user.updateMany({
        where: { systemRole: 'STUDENT' },
        data: {
            gender: null,
            birthDate: null,
            nationality: null
        }
    });

    console.log(`Successfully cleared data for ${result.count} students.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
