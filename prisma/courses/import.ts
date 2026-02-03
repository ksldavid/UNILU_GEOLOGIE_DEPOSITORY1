// Script d'import des cours avec Prisma Client
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

// Fichiers CSV par niveau
const LEVEL_FILES: Record<string, string> = {
    'prescience': 'presciences.csv',
    'b1': 'b1.csv',
    'b2': 'b2.csv',
    'b3': 'b3.csv',
    'm1_hydro': 'm1_environnement_hydrogeologie.csv',
    'm1_exploration': 'm1_exploration_geologie_minieres.csv',
    'm1_geotechnique': 'm1_geotechnique.csv',
    'm2_hydro': 'm2_environnement_hydrogeologie.csv',
    'm2_exploration': 'm2_exploration_geologie_minieres.csv',
    'm2_geotechnique': 'm2_geotechnique.csv'
}

const LEVEL_MAPPING: Record<string, string> = {
    'presciences': 'prescience',
    'm1_environnement': 'm1_hydro',
    'm2_environnement': 'm2_hydro',
};

const FILES_TO_PROCESS = [
    { level: 'prescience', file: 'presciences.csv' },
    { level: 'b1', file: 'b1.csv' },
    { level: 'b2', file: 'b2.csv' },
    { level: 'b3', file: 'b3.csv' },
    { level: 'm1_hydro', file: 'm1_environnement_hydrogeologie.csv' },
    { level: 'm1_exploration', file: 'm1_exploration_geologie_minieres.csv' },
    { level: 'm1_geotechnique', file: 'm1_geotechnique.csv' },
    { level: 'm2_hydro', file: 'm2_environnement_hydrogeologie.csv' },
    { level: 'm2_exploration', file: 'm2_exploration_geologie_minieres.csv' },
    { level: 'm2_geotechnique', file: 'm2_geotechnique.csv' }
];

interface CourseData {
    code: string
    name: string
    description?: string
    academicYear: string
    level: string
}

async function importCourses(levelCode: string, fileName: string) {
    const filePath = path.join(__dirname, 'data', fileName)

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Fichier non trouvé: ${fileName} (ignoré)`)
        return { success: 0, failed: 0, skipped: 0 }
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const courses: CourseData[] = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    })

    console.log(`\n📂 Import de ${courses.length} cours depuis ${fileName}`)
    console.log(`🎓 Niveau par défaut: ${levelCode}\n`)

    let success = 0
    let failed = 0
    let skipped = 0

    for (const data of courses) {
        try {
            let targetLevelCode = data.level || levelCode;

            // Appliquer le mapping si nécessaire
            if (LEVEL_MAPPING[targetLevelCode]) {
                targetLevelCode = LEVEL_MAPPING[targetLevelCode];
            }

            // 1. Upsert du cours
            const course = await prisma.course.upsert({
                where: { code: data.code },
                update: {
                    name: data.name,
                    description: data.description || null,
                },
                create: {
                    code: data.code,
                    name: data.name,
                    description: data.description || null,
                }
            })

            // 2. Lier au niveau académique
            const academicLevel = await prisma.academicLevel.findUnique({
                where: { code: targetLevelCode }
            })

            if (academicLevel) {
                await prisma.academicLevel.update({
                    where: { id: academicLevel.id },
                    data: {
                        courses: {
                            connect: { code: course.code }
                        }
                    }
                })
                console.log(`✅ Créé/Lié: ${course.code} - ${course.name} [${targetLevelCode}]`)
                success++
            } else {
                console.error(`❌ Niveau académique introuvable: ${targetLevelCode} pour le cours ${course.code}`)
                failed++
            }

        } catch (error: any) {
            console.error(`❌ Erreur pour ${data.code}: ${error.message}`)
            failed++
        }
    }

    console.log(`\n📊 Résumé pour ${fileName}:`)
    console.log(` ✅ Succès: ${success}`)
    console.log(` ❌ Échecs: ${failed}`)

    return { success, failed, skipped }
}

async function main() {
    const args = process.argv.slice(2)

    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║             📚 IMPORTATION DES COURS (VIA PRISMA)                  ║
╚════════════════════════════════════════════════════════════════════╝
`)

    if (args.includes('--all')) {
        console.log('🚀 Import de TOUS les cours...\n')

        let totalSuccess = 0
        let totalFailed = 0

        for (const { level, file } of FILES_TO_PROCESS) {
            const result = await importCourses(level, file)
            totalSuccess += result.success
            totalFailed += result.failed
        }

        console.log(`\n${'='.repeat(70)}`)
        console.log(`📊 RÉSUMÉ GLOBAL`)
        console.log(`${'='.repeat(70)}`)
        console.log(`✅ Total créés/mis à jour: ${totalSuccess}`)
        console.log(`❌ Total échecs: ${totalFailed}`)
        console.log(`${'='.repeat(70)}\n`)

    } else if (args.includes('--level')) {
        const levelIndex = args.indexOf('--level')
        const levelCode = args[levelIndex + 1]

        if (!LEVEL_FILES[levelCode]) {
            console.error(`❌ Niveau inconnu: ${levelCode}`)
            console.log(`\nNiveaux disponibles:`)
            Object.keys(LEVEL_FILES).forEach(code => console.log(`  - ${code}`))
            process.exit(1)
        }

        await importCourses(levelCode, LEVEL_FILES[levelCode])

    } else {
        console.log(`
Utilisation:
  npx tsx prisma/courses/import.ts --all              # Importer tous les cours
  npx tsx prisma/courses/import.ts --level b1         # Importer cours B1
        `)
    }
}

main()
    .catch((error) => {
        console.error('\n❌ ERREUR GLOBALE:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
