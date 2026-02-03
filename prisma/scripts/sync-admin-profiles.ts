import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function syncProfiles() {
    console.log('--- 🔄 SYNCHRONISATION DES PROFILS ADMIN/ACADÉMIQUE ---')

    // 1. Récupérer les admins existants
    const admins = await prisma.user.findMany({
        where: { systemRole: 'ADMIN' }
    })

    for (const admin of admins) {
        await prisma.adminProfile.upsert({
            where: { userId: admin.id },
            update: {
                name: admin.name,
                role: 'Administrateur Principal'
            },
            create: {
                id: admin.id,
                userId: admin.id,
                name: admin.name,
                role: 'Administrateur Principal'
            }
        })
        console.log(`✅ Profil Admin créé pour : ${admin.email}`)
    }

    // 2. Récupérer le service académique existant
    const acads = await prisma.user.findMany({
        where: { systemRole: 'ACADEMIC_OFFICE' }
    })

    for (const acad of acads) {
        await prisma.academicProfile.upsert({
            where: { userId: acad.id },
            update: {
                name: acad.name,
                title: 'Direction du Service Académique'
            },
            create: {
                id: acad.id,
                userId: acad.id,
                name: acad.name,
                title: 'Direction du Service Académique'
            }
        })
        console.log(`✅ Profil Académique créé pour : ${acad.email}`)
    }
}

syncProfiles()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
