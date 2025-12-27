// Script d'import des professeurs
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

interface ProfessorData {
    firstName: string
    lastName: string
    email: string
    password: string
}

async function importProfessors() {
    const filePath = path.join(__dirname, 'data', 'professors.csv')

    if (!fs.existsSync(filePath)) {
        console.error(`❌ Fichier introuvable: ${filePath}`)
        console.log(`📝 Créez le fichier professors/data/professors.csv avec les colonnes:`)
        console.log(`   firstName,lastName,email,password`)
        return
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const professors: ProfessorData[] = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    })

    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                 👨‍🏫 IMPORTATION DES PROFESSEURS                     ║
╚════════════════════════════════════════════════════════════════════╝
`)

    console.log(`📂 Import de ${professors.length} professeurs\n`)

    let success = 0
    let failed = 0
    let skipped = 0

    try {
        for (const prof of professors) {
            try {
                // Vérifier si l'email existe déjà
                const existingUser = await prisma.user.findUnique({
                    where: { email: prof.email }
                })

                if (existingUser) {
                    console.log(`⚠️  Existe déjà: ${prof.email}`)
                    skipped++
                    continue
                }

                // Hacher le mot de passe
                const hashedPassword = await bcrypt.hash(prof.password, 10)

                // Créer le professeur (systemRole = USER, pas STUDENT)
                await prisma.user.create({
                    data: {
                        firstName: prof.firstName,
                        lastName: prof.lastName,
                        email: prof.email,
                        password: hashedPassword,
                        systemRole: 'USER'
                    }
                })

                console.log(`✅ Créé: ${prof.firstName} ${prof.lastName} (${prof.email})`)
                success++

            } catch (error: any) {
                console.error(`❌ Erreur pour ${prof.email}: ${error.message}`)
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
⚠️  Ignorés (déjà existants): ${skipped}
❌ Échecs: ${failed}
${'='.repeat(70)}

💡 Note: Les professeurs ont été créés avec systemRole = USER.
   Pour les assigner à des cours, utilisez Prisma Studio ou l'interface web.
`)
}

importProfessors()
    .catch((error) => {
        console.error('\n❌ ERREUR GLOBALE:', error)
        process.exit(1)
    })
