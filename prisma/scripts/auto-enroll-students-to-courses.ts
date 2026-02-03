/**
 * Script d'inscription automatique des étudiants aux cours
 * 
 * Ce script inscrit automatiquement tous les étudiants aux cours de leur niveau académique.
 * 
 * Logique :
 * - Pour chaque StudentEnrollment (inscription au niveau académique)
 * - Récupérer tous les cours du même niveau + même année académique
 * - Créer un StudentCourseEnrollment pour chaque cours
 * 
 * Utilisation :
 *   npx tsx prisma/scripts/auto-enroll-students-to-courses.ts
 *   npx tsx prisma/scripts/auto-enroll-students-to-courses.ts --dry-run  # Simulation
 */

import 'dotenv/config'
import pkg from 'pg'
const { Client } = pkg

interface StudentEnrollmentData {
    userId: number
    academicLevelCode: string
    academicYear: string
    studentName: string
}

interface CourseData {
    id: number
    code: string
    name: string
}

async function autoEnrollStudents(dryRun: boolean = false) {
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
        console.error('❌ DATABASE_URL non trouvée dans .env')
        process.exit(1)
    }

    const client = new Client({
        connectionString: databaseUrl,
    })

    try {
        await client.connect()

        console.log(`
╔════════════════════════════════════════════════════════════════════╗
║            📚 AUTO-INSCRIPTION DES ÉTUDIANTS AUX COURS            ║
╚════════════════════════════════════════════════════════════════════╝
`)

        if (dryRun) {
            console.log('⚠️  MODE SIMULATION - Aucune modification ne sera effectuée\n')
        }

        // Étape 1 : Récupérer tous les StudentEnrollment avec les infos de l'étudiant
        console.log('📊 Récupération des inscriptions académiques...\n')

        const enrollmentsResult = await client.query(`
            SELECT 
                se."userId",
                se."academicYear",
                al.code as "academicLevelCode",
                al."displayName" as "levelName",
                u.name as "studentName",
                u.email
            FROM "StudentEnrollment" se
            JOIN "AcademicLevel" al ON se."academicLevelId" = al.id
            JOIN "User" u ON se."userId" = u.id
            WHERE u."deletedAt" IS NULL
            ORDER BY al."order", u.name
        `)

        const studentEnrollments = enrollmentsResult.rows

        if (studentEnrollments.length === 0) {
            console.log('⚠️  Aucune inscription académique trouvée')
            return
        }

        console.log(`✅ ${studentEnrollments.length} inscriptions académiques trouvées\n`)

        let totalCreated = 0
        let totalSkipped = 0
        let totalErrors = 0

        // Étape 2 : Pour chaque inscription académique, inscrire aux cours
        for (const enrollment of studentEnrollments) {
            const { userId, academicLevelCode, academicYear, studentName, levelName } = enrollment

            // Récupérer tous les cours liés à ce niveau (via relation Many-to-Many)
            // Jointure implicite Prisma : _AcademicLevelToCourse (A=Course.code, B=AcademicLevel.id)
            const coursesResult = await client.query(`
                SELECT c.code, c.name
                FROM "Course" c
                JOIN "_AcademicLevelToCourse" j ON c.code = j."B"
                JOIN "AcademicLevel" al ON al.id = j."A"
                WHERE al.code = $1
                ORDER BY c.code
            `, [academicLevelCode])

            const courses = coursesResult.rows

            if (courses.length === 0) {
                console.log(`⚠️  ${studentName} (${levelName}, ${academicYear}) : Aucun cours trouvé`)
                continue
            }

            console.log(`\n👤 ${studentName} - ${levelName} (${academicYear})`)
            console.log(`   📚 ${courses.length} cours disponibles`)

            let studentCreated = 0
            let studentSkipped = 0

            for (const course of courses) {
                try {
                    // Vérifier si déjà inscrit
                    const existingEnrollment = await client.query(`
                        SELECT id FROM "StudentCourseEnrollment"
                        WHERE "userId" = $1
                        AND "courseCode" = $2
                        AND "academicYear" = $3
                    `, [userId, course.code, academicYear])

                    if (existingEnrollment.rows.length > 0) {
                        console.log(`   ⏭️  ${course.code} - Déjà inscrit`)
                        studentSkipped++
                        totalSkipped++
                        continue
                    }

                    if (!dryRun) {
                        // Créer l'inscription au cours
                        await client.query(`
                            INSERT INTO "StudentCourseEnrollment" 
                            ("userId", "courseCode", "academicYear", "enrolledAt", "isActive")
                            VALUES ($1, $2, $3, NOW(), true)
                        `, [userId, course.code, academicYear])
                    }

                    console.log(`   ✅ ${course.code} - ${course.name}`)
                    studentCreated++
                    totalCreated++

                } catch (error: any) {
                    console.error(`   ❌ ${course.code} - Erreur: ${error.message}`)
                    totalErrors++
                }
            }

            console.log(`   📊 Résumé : ${studentCreated} créés, ${studentSkipped} déjà inscrits`)
        }

        // Résumé final
        console.log(`\n${'═'.repeat(70)}`)
        console.log(`📊 RÉSUMÉ GLOBAL`)
        console.log(`${'═'.repeat(70)}`)
        console.log(`✅ Total inscriptions créées : ${totalCreated}`)
        console.log(`⏭️  Total déjà inscrits       : ${totalSkipped}`)
        console.log(`❌ Total erreurs             : ${totalErrors}`)
        console.log(`${'═'.repeat(70)}\n`)

        if (dryRun) {
            console.log('⚠️  MODE SIMULATION : Aucune modification n\'a été effectuée')
            console.log('💡 Exécutez sans --dry-run pour appliquer les changements\n')
        } else {
            console.log('✨ Auto-inscription terminée avec succès !\n')
        }

    } catch (error) {
        console.error('❌ Erreur critique:', error)
        process.exit(1)
    } finally {
        await client.end()
    }
}

// Exécution
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

autoEnrollStudents(dryRun)
    .catch((error) => {
        console.error('❌ ERREUR GLOBALE:', error)
        process.exit(1)
    })
