
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const levelCode = 'prescience';
    const academicYear = '2025-2026';
    const room = 'Amphi Géologie';

    const level = await prisma.academicLevel.findUnique({
        where: { code: levelCode }
    });

    if (!level) {
        console.error(`Niveau ${levelCode} non trouvé`);
        return;
    }

    // Nettoyer l'ancien emploi du temps pour ce niveau
    await prisma.schedule.deleteMany({
        where: { academicLevelId: level.id }
    });

    const courses = [
        { day: 'Lundi', startTime: '08:00', endTime: '10:00', code: 'MATH191A' },
        { day: 'Lundi', startTime: '10:00', endTime: '12:00', code: 'COMM196A' },
        { day: 'Lundi', startTime: '13:00', endTime: '15:00', code: 'GEOS199A' },

        { day: 'Mardi', startTime: '08:00', endTime: '10:00', code: 'MATH191B' },
        { day: 'Mardi', startTime: '10:00', endTime: '12:00', code: 'CHIM193A' },
        { day: 'Mardi', startTime: '13:00', endTime: '15:00', code: 'PHYS194A' },

        { day: 'Mercredi', startTime: '08:00', endTime: '10:00', code: 'MATH192A' },
        { day: 'Mercredi', startTime: '10:00', endTime: '12:00', code: 'SCIV195A' },
        { day: 'Mercredi', startTime: '13:00', endTime: '15:00', code: 'COMM196B' },

        { day: 'Jeudi', startTime: '08:00', endTime: '10:00', code: 'MATH192B' },
        { day: 'Jeudi', startTime: '10:00', endTime: '12:00', code: 'CHIM193B' },
        { day: 'Jeudi', startTime: '13:00', endTime: '15:00', code: 'SPA198A' },

        { day: 'Vendredi', startTime: '08:00', endTime: '10:00', code: 'GEOS199B' },
        { day: 'Vendredi', startTime: '10:00', endTime: '12:00', code: 'PHYS194B' },
        { day: 'Vendredi', startTime: '13:00', endTime: '15:00', code: 'COMM196C' },

        { day: 'Samedi', startTime: '08:00', endTime: '10:00', code: 'SCIV195B' },
        { day: 'Samedi', startTime: '10:00', endTime: '12:00', code: 'SPA198B' },
        { day: 'Samedi', startTime: '13:00', endTime: '15:00', code: 'SPA198C' },
    ];

    console.log(`⏳ Seeding schedule for ${level.name}...`);

    for (const c of courses) {
        await prisma.schedule.create({
            data: {
                day: c.day,
                startTime: c.startTime,
                endTime: c.endTime,
                courseCode: c.code,
                academicLevelId: level.id,
                academicYear: academicYear,
                room: room
            }
        });
    }

    console.log(`✅ Emploi du temps créé avec ${courses.length} sessions.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
