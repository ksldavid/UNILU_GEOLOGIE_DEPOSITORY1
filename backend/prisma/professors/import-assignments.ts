
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

async function importAssignments() {
    const filePath = path.join(process.cwd(), 'prisma', 'professors', 'data', 'course_assignments.csv')

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
║         📚 IMPORTATION DES CHARGES HORAIRES (ASSIGNATIONS)         ║
╚════════════════════════════════════════════════════════════════════╝
`)

    console.log(`📂 Import de ${assignments.length} assignations\n`)

    let success = 0
    let failed = 0

    try {
        for (const assign of assignments) {
            try {
                // Vérifier si le cours existe
                const course = await prisma.course.findUnique({
                    where: { code: assign.courseCode }
                })

                if (!course) {
                    console.warn(`⚠️ Cours introuvable: ${assign.courseCode} (Assignation ignorée)`)
                    failed++
                    continue
                }

                // Vérifier si le prof existe
                const prof = await prisma.user.findUnique({
                    where: { id: assign.profId },
                    include: { professorProfile: true }
                })

                if (!prof) {
                    console.warn(`⚠️ Professeur introuvable: ${assign.profId} (Assignation ignorée)`)
                    failed++
                    continue
                }

                // S'assurer que le profil professeur existe (au cas où)
                if (!prof.professorProfile) {
                    await prisma.professorProfile.create({
                        data: {
                            id: prof.id,
                            userId: prof.id
                        }
                    })
                }

                const role = assign.role === 'ASSISTANT' ? CourseRole.ASSISTANT : CourseRole.PROFESSOR

                // Créer l'assignation
                await prisma.courseEnrollment.upsert({
                    where: {
                        userId_courseCode_academicYear: {
                            userId: assign.profId,
                            courseCode: assign.courseCode,
                            academicYear: assign.academicYear
                        }
                    },
                    update: {
                        role: role
                    },
                    create: {
                        userId: assign.profId,
                        courseCode: assign.courseCode,
                        role: role,
                        academicYear: assign.academicYear
                    }
                })

                console.log(`✅ Assigné: ${assign.profId} -> ${assign.courseCode} [${assign.role}]`)
                success++

            } catch (error: any) {
                console.error(`❌ Erreur pour ${assign.profId} - ${assign.courseCode}: ${error.message}`)
                failed++
            }
        }

    } finally {
        await prisma.$disconnect()
    }

    console.log(`
${'='.repeat(70)}
📊 RÉSUMÉ
${'='.repeat(70)}
✅ Succès: ${success}
❌ Échecs: ${failed}
${'='.repeat(70)}
`)
}

importAssignments()
    .catch((error) => {
        console.error('\n❌ ERREUR GLOBALE:', error)
        process.exit(1)
    })
