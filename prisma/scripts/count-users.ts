import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function countUsers() {
    const roles = ['ADMIN', 'ACADEMIC_OFFICE', 'STUDENT', 'USER']
    console.log('--- 📊 COMPTAGE DES UTILISATEURS PAR RÔLE ---')

    for (const role of roles) {
        const count = await prisma.user.count({
            where: { systemRole: role as any }
        })
        console.log(`${role.padEnd(20)}: ${count}`)
    }
}

countUsers()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
