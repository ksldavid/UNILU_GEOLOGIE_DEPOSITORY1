/// <reference types="node" />
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Start seeding academic levels...');

    // Create Academic Levels
    const academicLevels = [
        {
            code: 'presciences',
            name: 'Presciences',
            displayName: 'Presciences / Géologie',
            order: 0,
            isActive: true,
        },
        {
            code: 'b1',
            name: 'Licence 1',
            displayName: 'B1 / Géologie',
            order: 1,
            isActive: true,
        },
        {
            code: 'b2',
            name: 'Licence 2',
            displayName: 'B2 / Géologie',
            order: 2,
            isActive: true,
        },
        {
            code: 'b3',
            name: 'Licence 3',
            displayName: 'B3 / Géologie',
            order: 3,
            isActive: true,
        },
        {
            code: 'm1',
            name: 'Master 1',
            displayName: 'M1 / Géologie',
            order: 4,
            isActive: true,
        },
        {
            code: 'm2',
            name: 'Master 2',
            displayName: 'M2 / Géologie',
            order: 5,
            isActive: true,
        },
    ];

    for (const level of academicLevels) {
        const academicLevel = await prisma.academicLevel.upsert({
            where: { code: level.code },
            update: {},
            create: level,
        });
        console.log(`✅ Created academic level: ${academicLevel.displayName}`);
    }

    console.log('✨ Seeding completed!');
}

main()
    .catch(async (e) => {
        console.error('❌ Error during seeding:', e);
        await prisma.$disconnect();
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
