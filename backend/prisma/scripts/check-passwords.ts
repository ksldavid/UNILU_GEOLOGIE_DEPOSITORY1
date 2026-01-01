import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPasswords() {
    const students = await prisma.user.findMany({
        where: { systemRole: 'STUDENT' },
        take: 5,
        select: { email: true, password: true }
    })

    console.log('--- 🔑 ÉCHANTILLON DE MOTS DE PASSE ÉTUDIANTS ---')
    students.forEach(s => {
        const isHashed = s.password.startsWith('$2')
        console.log(`Email: ${s.email.padEnd(30)} | Haché: ${isHashed ? '✅' : '❌ (' + s.password + ')'}`)
    })
}

checkPasswords()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
