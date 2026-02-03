import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    console.log('--- 🛡️ GÉNÉRATION DES COMPTES SYSTÈME ---')

    const systemUsers = [
        {
            id: 'ADMIN-001',
            name: 'Administrateur Général',
            email: 'admin@unilu.cd',
            password: 'AdminPassword123!', // À CHANGER APRÈS CONNEXION
            role: 'ADMIN' as const
        },
        {
            id: 'ACAD-001',
            name: 'Direction Service Académique',
            email: 'service.academique@unilu.cd',
            password: 'AcadPassword123!', // À CHANGER APRÈS CONNEXION
            role: 'ACADEMIC_OFFICE' as const
        }
    ]

    for (const u of systemUsers) {
        const hashedPassword = await bcrypt.hash(u.password, 10)

        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                systemRole: u.role,
                password: hashedPassword
            },
            create: {
                id: u.id,
                name: u.name,
                email: u.email,
                password: hashedPassword,
                systemRole: u.role
            }
        })
        console.log(`✅ Compte ${u.role} créé : ${u.email}`)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
