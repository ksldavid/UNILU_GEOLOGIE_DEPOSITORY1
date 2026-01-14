
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

// Configuration des fichiers CSV par classe (Basé sur les fichiers réels dans le dossier)
const CLASS_FILES: Record<string, string> = {
    'prescience': 'prescience (1).csv',
    'b1': 'bac_un.csv',
    'b2': 'bac_deux (1).csv',
    'b3': 'bac_trois (1).csv',
    'm1_geotechnique': 'master_un_geotchenique.csv',
    'm1_exploration': 'master_un_exploration_miniere.csv',
    // 'm1_hydro': '...', // Pas de fichier spécifique trouvé pour M1 Hydro dans students/
    'm2_geotechnique': 'master_deux_geothechnique.csv',
}

interface StudentCSV {
    Noms: string
    "Email address": string
    ID_Number?: string
    ID?: string
    Password: string
}

async function importStudents(levelCode: string, fileName: string) {
    const filePath = path.join(__dirname, fileName)

    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Fichier non trouvé: ${fileName} (ignoré)`)
        return
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const students: StudentCSV[] = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    })

    console.log(`\n📂 Import de ${students.length} étudiants pour le niveau: ${levelCode}`)

    const academicLevel = await prisma.academicLevel.findUnique({
        where: { code: levelCode }
    })

    if (!academicLevel) {
        console.error(`❌ Niveau académique introuvable: ${levelCode}`)
        return
    }

    let success = 0
    let failed = 0

    for (const student of students) {
        try {
            const studentId = (student.ID_Number || student.ID || "").toString().trim()

            if (!studentId) {
                console.error(`❌ ID manquant pour ${student.Noms}`)
                failed++
                continue
            }

            const hashedPassword = await bcrypt.hash(student.Password.toString(), 10)

            // 1. Créer ou mettre à jour l'utilisateur
            await prisma.user.upsert({
                where: { id: studentId },
                update: {
                    name: student.Noms,
                    email: student["Email address"].toLowerCase().trim(),
                    password: hashedPassword,
                    systemRole: 'STUDENT'
                },
                create: {
                    id: studentId,
                    name: student.Noms,
                    email: student["Email address"].toLowerCase().trim(),
                    password: hashedPassword,
                    systemRole: 'STUDENT'
                }
            })

            // 2. Inscrire au niveau académique pour l'année 2025-2026
            await prisma.studentEnrollment.upsert({
                where: {
                    userId_academicLevelId_academicYear: {
                        userId: studentId,
                        academicLevelId: academicLevel.id,
                        academicYear: '2025-2026'
                    }
                },
                update: {},
                create: {
                    userId: studentId,
                    academicLevelId: academicLevel.id,
                    academicYear: '2025-2026'
                }
            })

            success++
            if (success % 50 === 0) {
                process.stdout.write('.')
            }
        } catch (error: any) {
            console.error(`\n❌ Erreur pour ${student.Noms}: ${error.message}`)
            failed++
        }
    }

    console.log(`\n✅ Terminé pour ${levelCode}: ${success} succès, ${failed} erreurs.`)
}

async function main() {
    const args = process.argv.slice(2)

    if (args.includes('--all')) {
        for (const [level, file] of Object.entries(CLASS_FILES)) {
            await importStudents(level, file)
        }
    } else {
        console.log("Usage: npx ts-node prisma/students/import-simple.ts --all")
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
