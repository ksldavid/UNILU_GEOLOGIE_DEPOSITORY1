// Script d'import des cours
import 'dotenv/config'
import pkg from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const { Client } = pkg

// Fichiers CSV par niveau
// Fichiers CSV par niveau
const LEVEL_FILES: Record<string, string> = {
    'presciences': 'presciences.csv',
    'b1': 'b1.csv',
    'b2': 'b2.csv',
    'b3': 'b3.csv',
    // M1 et M2 sont maintenant génériques
    'm1': 'm1_environnement_hydrogeologie.csv', // On utilise un fichier par défaut ou on pourrait modifier la logique pour lire plusieurs
    'm2': 'm2_environnement_hydrogeologie.csv'  // Idem
}

// Note: Pour M1 et M2, comme nous avons plusieurs fichiers sources mais une seule "destination" logique (m1/m2),
// nous allons adapter le script pour lire tous les fichiers pertinents si on demande 'm1' ou 'm2'.
// Mais pour l'instant, simplifions en disant que nous avons fusionné les fichiers ou que nous traitons fichier par fichier.

// Pour faire simple et respecter les fichiers existants :
const FILES_TO_PROCESS = [
    { level: 'presciences', file: 'presciences.csv' },
    { level: 'b1', file: 'b1.csv' },
    { level: 'b2', file: 'b2.csv' },
    { level: 'b3', file: 'b3.csv' },
    // M1 - Spécialisations
    { level: 'm1_environnement', file: 'm1_environnement_hydrogeologie.csv' },
    { level: 'm1_exploration', file: 'm1_exploration_geologie_minieres.csv' },
    { level: 'm1_geotechnique', file: 'm1_geotechnique.csv' },
    // M2 - Spécialisations
    { level: 'm2_environnement', file: 'm2_environnement_hydrogeologie.csv' },
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
    console.log(`🎓 Niveau: ${levelCode} (Code CSV) -> Vers Base de données\n`)

    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
        console.error('❌ DATABASE_URL introuvable')
        process.exit(1)
    }

    const client = new Client({ connectionString: databaseUrl })
    await client.connect()

    let success = 0
    let failed = 0
    let skipped = 0

    try {
        for (const course of courses) {
            try {
                const targetLevel = course.level || levelCode;

                // 1. Insérer le cours ou mettre à jour
                await client.query(`
                    INSERT INTO "Course" (code, name, description)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (code) DO UPDATE SET
                        name = EXCLUDED.name,
                        description = EXCLUDED.description
                `, [course.code, course.name, course.description || null])

                // 2. Lier au niveau académique (Table de jointure implicite Prisma: _AcademicLevelToCourse)
                // A = AcademicLevel Id (Int), B = Course Code (String)
                await client.query(`
                    INSERT INTO "_AcademicLevelToCourse" ("A", "B")
                    SELECT id, $1 FROM "AcademicLevel" WHERE code = $2
                    ON CONFLICT DO NOTHING
                `, [course.code, targetLevel])

                console.log(`✅ Créé/Lié: ${course.code} - ${course.name} [${targetLevel}]`)
                success++

            } catch (error: any) {
                console.error(`❌ Erreur pour ${course.code}: ${error.message}`)
                failed++
            }
        }

    } finally {
        await client.end()
    }

    console.log(`\n📊 Résumé:`)
    console.log(` ✅ Succès: ${success}`)
    console.log(` ⚠️  Ignorés (déjà existants): ${skipped}`)
    console.log(` ❌ Échecs: ${failed}`)

    return { success, failed, skipped }
}

async function main() {
    const args = process.argv.slice(2)

    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                    📚 IMPORTATION DES COURS                        ║
╚════════════════════════════════════════════════════════════════════╝
`)

    if (args.includes('--all')) {
        console.log('🚀 Import de TOUS les cours...\n')

        let totalSuccess = 0
        let totalFailed = 0
        let totalSkipped = 0

        for (const { level, file } of FILES_TO_PROCESS) {
            const result = await importCourses(level, file)
            totalSuccess += result.success
            totalFailed += result.failed
            totalSkipped += result.skipped
        }

        console.log(`\n${'='.repeat(70)}`)
        console.log(`📊 RÉSUMÉ GLOBAL`)
        console.log(`${'='.repeat(70)}`)
        console.log(`✅ Total créés: ${totalSuccess}`)
        console.log(`⚠️  Total ignorés: ${totalSkipped}`)
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
  npx tsx prisma/courses/import.ts --level m1_geotechnique
        `)
    }
}

main()
    .catch((error) => {
        console.error('\n❌ ERREUR GLOBALE:', error)
        process.exit(1)
    })
