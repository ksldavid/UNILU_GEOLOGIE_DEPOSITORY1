
import 'dotenv/config'
import { PrismaClient, CourseRole } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

interface AssignmentData {
    profID: string
    courseCode: string
    userRole: string
    academicYear: string
}

async function importAssignments() {
    const filePath = path.join(process.cwd(), 'prisma', 'professors', 'data', 'cours_attribution_professeurs.csv')

    if (!fs.existsSync(filePath)) {
        console.error(`❌ Fichier introuvable: ${filePath}`)
        return
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const assignments: AssignmentData[] = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true
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
                    where: { id: assign.profID },
                    include: { professorProfile: true }
                })

                if (!prof) {
                    console.warn(`⚠️ Professeur introuvable: ${assign.profID} (Assignation ignorée)`)
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

                const role = assign.userRole === 'ASSISTANT' ? CourseRole.ASSISTANT : CourseRole.PROFESSOR

                // Créer l'assignation
                await prisma.courseEnrollment.upsert({
                    where: {
                        userId_courseCode_academicYear: {
                            userId: assign.profID,
                            courseCode: assign.courseCode,
                            academicYear: assign.academicYear
                        }
                    },
                    update: {
                        role: role
                    },
                    create: {
                        userId: assign.profID,
                        courseCode: assign.courseCode,
                        role: role,
                        academicYear: assign.academicYear
                    }
                })

                console.log(`✅ Assigné: ${assign.profID} -> ${assign.courseCode} [${assign.userRole}]`)
                success++

            } catch (error: any) {
                console.error(`❌ Erreur pour ${assign.profID} - ${assign.courseCode}: ${error.message}`)
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
