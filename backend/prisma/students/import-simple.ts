// Script d'import simplifié utilisant pg directement (plus fiable que PrismaClient)
import 'dotenv/config'
import pkg from 'pg'
import * as bcrypt from 'bcrypt'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const { Client } = pkg

// Configuration des fichiers CSV par classe
// Configuration des fichiers CSV par classe
const CLASS_FILES: Record<string, string> = {
    'presciences': 'presciences.csv',
    'b1': 'b1.csv',
    'b2': 'b2.csv',
    'b3': 'b3.csv',
    // Master 1 - Spécialisations
    'm1_geotechnique': 'm1_geotechnique.csv',
    'm1_exploration': 'm1_exploration_geologie_minieres.csv',
    'm1_environnement': 'm1_environnement_hydrogeologie.csv',
    // Master 2 - Spécialisations
    'm2_geotechnique': 'm2_geotechnique.csv',
    'm2_exploration': 'm2_exploration_geologie_minieres.csv',
    'm2_environnement': 'm2_environnement_hydrogeologie.csv'
}

interface StudentData {
    firstName: string
    lastName: string
    email: string
    password: string
    academicYear: string
}

async function importStudents(classCode: string, fileName: string) {
    const filePath = path.join(__dirname, 'data', fileName)

    if (!fs.existsSync(filePath)) {
        console.error(`❌ Fichier introuvable: ${filePath}`)
        return { success: 0, failed: 0, skipped: 0 }
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const students: StudentData[] = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    })

    console.log(`\n📂 Import de ${students.length} étudiants depuis ${fileName}`)
    console.log(`🎓 Niveau: ${classCode}\n`)

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
        // Récupérer l'ID du niveau académique
        const levelResult = await client.query(
            'SELECT id FROM "AcademicLevel" WHERE code = $1',
            [classCode]
        )

        if (levelResult.rows.length === 0) {
            console.error(`❌ Niveau académique '${classCode}' introuvable dans la base`)
            return { success: 0, failed: 0, skipped: 0 }
        }

        const academicLevelId = levelResult.rows[0].id

        for (const student of students) {
            try {
                // Vérifier si l'email existe déjà
                const existingUser = await client.query(
                    'SELECT id FROM "User" WHERE email = $1',
                    [student.email]
                )

                if (existingUser.rows.length > 0) {
                    console.log(`⚠️  Existe déjà: ${student.email}`)
                    skipped++
                    continue
                }

                // Hacher le mot de passe
                const hashedPassword = await bcrypt.hash(student.password, 10)

                // Créer l'utilisateur
                const userResult = await client.query(
                    `INSERT INTO "User" ("firstName", "lastName", email, password, "systemRole", "createdAt", "updatedAt")
                     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                     RETURNING id`,
                    [student.firstName, student.lastName, student.email, hashedPassword, 'STUDENT']
                )

                const userId = userResult.rows[0].id

                // Créer l'inscription
                await client.query(
                    `INSERT INTO "StudentEnrollment" ("userId", "academicLevelId", "academicYear", "enrolledAt")
                     VALUES ($1, $2, $3, NOW())`,
                    [userId, academicLevelId, student.academicYear]
                )

                console.log(`✅ Créé: ${student.firstName} ${student.lastName} (${student.email})`)
                success++

            } catch (error: any) {
                console.error(`❌ Erreur pour ${student.email}: ${error.message}`)
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
║                 📚 IMPORTATION DES ÉTUDIANTS                       ║
╚════════════════════════════════════════════════════════════════════╝
`)

    if (args.includes('--all')) {
        console.log('🚀 Import de TOUTES les classes...\n')

        let totalSuccess = 0
        let totalFailed = 0
        let totalSkipped = 0

        for (const [classCode, fileName] of Object.entries(CLASS_FILES)) {
            const result = await importStudents(classCode, fileName)
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

    } else if (args.includes('--class')) {
        const classIndex = args.indexOf('--class')
        const classCode = args[classIndex + 1]

        if (!CLASS_FILES[classCode]) {
            console.error(`❌ Classe inconnue: ${classCode}`)
            console.log(`\nClasses disponibles:`)
            Object.keys(CLASS_FILES).forEach(code => console.log(`  - ${code}`))
            process.exit(1)
        }

        await importStudents(classCode, CLASS_FILES[classCode])

    } else {
        console.log(`
Utilisation:
  npx tsx prisma/students/import-simple.ts --all              # Importer tout
  npx tsx prisma/students/import-simple.ts --class b1         # Importer B1
  npx tsx prisma/students/import-simple.ts --class m1_geotechnique
        `)
    }
}

main()
    .catch((error) => {
        console.error('\n❌ ERREUR GLOBALE:', error)
        process.exit(1)
    })
