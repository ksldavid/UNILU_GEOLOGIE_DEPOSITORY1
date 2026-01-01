import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

interface AcademicUserCSV {
    id: string
    name: string
    email: string
    password: string
    title: string
}

async function importAcademicUsers() {
    const filePath = path.join(process.cwd(), 'prisma', 'academicService-users', 'data', 'academic_users.csv')

    if (!fs.existsSync(filePath)) {
        console.error(`❌ Fichier introuvable: ${filePath}`)
        return
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const users = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    }) as AcademicUserCSV[]

    console.log(`🎓 IMPORT DU SERVICE ACADÉMIQUE (${users.length})\n`)

    for (const u of users) {
        const hashedPassword = await bcrypt.hash(u.password, 10)

        // 1. Upsert de l'Utilisateur (on utilise l'ID comme clé car c'est la PK)
        const user = await prisma.user.upsert({
            where: { id: u.id },
            update: {
                name: u.name,
                email: u.email,
                password: hashedPassword,
                systemRole: 'ACADEMIC_OFFICE'
            },
            create: {
                id: u.id,
                name: u.name,
                email: u.email,
                password: hashedPassword,
                systemRole: 'ACADEMIC_OFFICE'
            }
        })

        // 2. Upsert du Profile Académique lié
        await prisma.academicProfile.upsert({
            where: { userId: user.id },
            update: {
                name: u.name,
                title: u.title
            },
            create: {
                id: user.id, // Match User.id
                userId: user.id,
                name: u.name,
                title: u.title
            }
        })

        console.log(`✅ Academic User & Profile mis à jour/créé : ${u.name} (${u.email})`)
    }
}


importAcademicUsers()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
