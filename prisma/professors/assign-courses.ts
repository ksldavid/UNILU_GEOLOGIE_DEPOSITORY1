import 'dotenv/config'
import { PrismaClient, CourseRole } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

interface AssignmentData {
    profId: string
    courseCode: string
    role: string
    academicYear: string
}

async function assignCourses() {
    const filePath = path.join(__dirname, 'data', 'course_assignments.csv')

    if (!fs.existsSync(filePath)) {
        console.error(`❌ Fichier introuvable: ${filePath}`)
        return
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const assignments: AssignmentData[] = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    })

    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                📋 AFFECTATION DES CHARGES HORAIRES                 ║
╚════════════════════════════════════════════════════════════════════╝
`)

    console.log(`📂 Traitement de ${assignments.length} affectations...\n`)

    let success = 0
    let failed = 0

    for (const entry of assignments) {
        try {
            // 1. Vérifier si le cours existe
            const course = await prisma.course.findUnique({
                where: { code: entry.courseCode }
            })

            if (!course) {
                console.error(`❌ Cours introuvable: ${entry.courseCode} (Ignoré)`)
                failed++
                continue
            }

            // 2. Vérifier si le professeur existe
            const prof = await prisma.user.findUnique({
                where: { id: entry.profId },
                include: { professorProfile: true }
            })

            if (!prof || !prof.professorProfile) {
                console.error(`❌ Professeur introuvable: ${entry.profId} (Ignoré)`)
                failed++
                continue
            }

            // 3. Valider le rôle
            const role = entry.role.toUpperCase() === 'PROFESSOR' ? CourseRole.PROFESSOR : CourseRole.ASSISTANT

            // 4. Créer ou mettre à jour l'enrôlement
            await prisma.courseEnrollment.upsert({
                where: {
                    userId_courseCode_academicYear: {
                        userId: entry.profId,
                        courseCode: entry.courseCode,
                        academicYear: entry.academicYear
                    }
                },
                update: {
                    role: role
                },
                create: {
                    userId: entry.profId,
                    courseCode: entry.courseCode,
                    role: role,
                    academicYear: entry.academicYear
                }
            })

            console.log(`✅ ${entry.profId} -> ${entry.courseCode} [${role}]`)
            success++

        } catch (error: any) {
            console.error(`❌ Erreur sur ${entry.profId}/${entry.courseCode}: ${error.message}`)
            failed++
        }
    }

    console.log(`
📊 RÉSUMÉ
══════════════════════════════════════════════════════════════════════
✅ Affectations réussies : ${success}
❌ Échecs/Ignorés       : ${failed}
══════════════════════════════════════════════════════════════════════
`)

    await prisma.$disconnect()
}

assignCourses()
    .catch((error) => {
        console.error('\n❌ ERREUR GLOBALE:', error)
        process.exit(1)
    })
