import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

const COURSES_DIR = path.join(process.cwd(), 'prisma/courses/data')

// Mapping des niveaux du CSV vers les détails de l'AcademicLevel
const levelMapping: { [key: string]: { id: number, code: string, name: string, order: number } } = {
    'presciences': { id: 0, code: 'prescience', name: 'Prescience', order: 0 },
    'b1': { id: 1, code: 'b1', name: 'Licence 1 (B1)', order: 1 },
    'b2': { id: 2, code: 'b2', name: 'Licence 2 (B2)', order: 2 },
    'b3': { id: 3, code: 'b3', name: 'Licence 3 (B3)', order: 3 },
    'm1_environnement': { id: 4, code: 'm1_hydro', name: 'Master 1 (Hydro)', order: 4 },
    'm1_exploration': { id: 5, code: 'm1_exploration', name: 'Master 1 (Exploration)', order: 5 },
    'm1_geotechnique': { id: 6, code: 'm1_geotechnique', name: 'Master 1 (Géotechnique)', order: 6 },
    'm2_environnement': { id: 7, code: 'm2_hydro', name: 'Master 2 (Hydro)', order: 7 },
    'm2_exploration': { id: 8, code: 'm2_exploration', name: 'Master 2 (Exploration)', order: 8 },
    'm2_geotechnique': { id: 9, code: 'm2_geotechnique', name: 'Master 2 (Géotechnique)', order: 9 },
};

async function main() {
    console.log("📚 Début de l'importation des cours...");

    const files = fs.readdirSync(COURSES_DIR).filter(f => f.endsWith('.csv'));

    for (const file of files) {
        console.log(`\n📄 Traitement de : ${file}`);
        const filePath = path.join(COURSES_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        }) as any[];

        for (const record of records) {
            const { code, name, description, level } = record;

            if (!code || !name) continue;

            const mapping = levelMapping[level];
            if (!mapping) {
                console.warn(`⚠️  Niveau inconnu dans le CSV : ${level} (Cours: ${code})`);
                continue;
            }

            // 1. S'assurer que le niveau académique existe
            const academicLevel = await prisma.academicLevel.upsert({
                where: { id: mapping.id },
                update: {
                    code: mapping.code,
                    name: mapping.name,
                    order: mapping.order,
                },
                create: {
                    id: mapping.id,
                    code: mapping.code,
                    name: mapping.name,
                    displayName: mapping.name + " / Géologie",
                    order: mapping.order,
                }
            });

            // 2. Créer ou mettre à jour le cours
            await prisma.course.upsert({
                where: { code: code },
                update: {
                    name: name,
                    description: description,
                    academicLevels: {
                        connect: { id: academicLevel.id }
                    }
                },
                create: {
                    code: code,
                    name: name,
                    description: description,
                    academicLevels: {
                        connect: { id: academicLevel.id }
                    }
                }
            });
        }
    }

    console.log("\n✅ Tous les cours ont été importés avec succès !");
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
