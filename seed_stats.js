
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const students = await prisma.user.findMany({
        where: { systemRole: 'STUDENT' }
    });

    console.log(`Updating ${students.length} students with demo stats...`);

    const nationalities = ['Congolaise', 'Belge', 'Française', 'Angolaise', 'Zambienne'];
    const genders = ['M', 'F'];

    for (const student of students) {
        const randomGender = genders[Math.floor(Math.random() * genders.length)];
        const randomNat = nationalities[Math.floor(Math.random() * nationalities.length)];

        // Random birth year between 1995 and 2007
        const year = 1995 + Math.floor(Math.random() * 13);
        const month = Math.floor(Math.random() * 12);
        const day = 1 + Math.floor(Math.random() * 28);
        const birthDate = new Date(year, month, day);

        await prisma.user.update({
            where: { id: student.id },
            data: {
                gender: randomGender,
                nationality: randomNat,
                birthDate: birthDate
            }
        });
    }

    console.log('Seeding finished.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
