import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

interface AdminCSV {
    id: string
    name: string
    email: string
    password: string
    role: string
}

async function importAdmins() {
    const filePath = path.join(process.cwd(), 'prisma', 'admin-users', 'data', 'admins.csv')

    if (!fs.existsSync(filePath)) {
        console.error(`❌ Fichier introuvable: ${filePath}`)
        return
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const admins = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    }) as AdminCSV[]

    console.log(`🛡️ IMPORT DES ADMINISTRATEURS (${admins.length})\n`)

    for (const adminData of admins) {
        const hashedPassword = await bcrypt.hash(adminData.password, 10)

        // 1. Upsert de l'Utilisateur (on utilise l'ID comme clé)
        const user = await prisma.user.upsert({
            where: { id: adminData.id },
            update: {
                name: adminData.name,
                email: adminData.email,
                password: hashedPassword,
                systemRole: 'ADMIN'
            },
            create: {
                id: adminData.id,
                name: adminData.name,
                email: adminData.email,
                password: hashedPassword,
                systemRole: 'ADMIN'
            }
        })

        // 2. Upsert du Profile Admin lié
        await prisma.adminProfile.upsert({
            where: { userId: user.id },
            update: {
                name: adminData.name,
                role: adminData.role
            },
            create: {
                id: user.id, // Match User.id
                userId: user.id,
                name: adminData.name,
                role: adminData.role
            }
        })

        console.log(`✅ Admin & Profile mis à jour/créé : ${adminData.name} (${adminData.email})`)
    }
}


importAdmins()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
