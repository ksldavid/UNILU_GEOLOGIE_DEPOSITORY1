// Script d'import des professeurs
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

interface ProfessorData {
    Noms: string
    Statut: string
    ID_Number: string
    Password: string
}

async function importProfessors() {
    const filePath = path.join(process.cwd(), 'prisma', 'professors', 'data', 'professeur_idNumber_password_FINAL_final.csv')

    if (!fs.existsSync(filePath)) {
        console.error(`❌ Fichier introuvable: ${filePath}`)
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
                // Générer un email par défaut à partir de l'ID si non fourni
                const email = `${prof.ID_Number.toLowerCase()}@unilu.cd`

                // Hacher le mot de passe
                const hashedPassword = await bcrypt.hash(prof.Password, 10)

                // Créer le professeur (User + ProfessorProfile)
                await prisma.user.upsert({
                    where: { id: prof.ID_Number },
                    update: {
                        name: prof.Noms,
                        email: email,
                        professorProfile: {
                            upsert: {
                                create: {
                                    id: prof.ID_Number,
                                    title: prof.Statut || null
                                },
                                update: { title: prof.Statut || null }
                            }
                        }
                    },
                    create: {
                        id: prof.ID_Number,
                        name: prof.Noms,
                        email: email,
                        password: hashedPassword,
                        systemRole: 'USER',
                        professorProfile: {
                            create: {
                                id: prof.ID_Number,
                                title: prof.Statut || null
                            }
                        }
                    }
                })

                console.log(`✅ Créé/Mis à jour: ${prof.Noms} [${prof.Statut || 'Sans titre'}]`)
                success++

            } catch (error: any) {
                console.error(`❌ Erreur pour ${prof.Noms}: ${error.message}`)
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
`)
}

importProfessors()
    .catch((error) => {
        console.error('\n❌ ERREUR GLOBALE:', error)
        process.exit(1)
    })
