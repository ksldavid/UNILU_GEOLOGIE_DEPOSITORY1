import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function hashAllPasswords() {
    console.log('--- 🔐 HACHAGE DE TOUS LES MOTS DE PASSE EN ATTENTE ---')

    // On récupère tous les utilisateurs
    const users = await prisma.user.findMany({
        select: { id: true, password: true, email: true }
    })

    let count = 0
    let alreadyHashed = 0

    for (const user of users) {
        // Si le mot de passe ne commence pas par $2 (format bcrypt habituel)
        if (!user.password.startsWith('$2')) {
            const hashedPassword = await bcrypt.hash(user.password, 10)
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            })
            if (count % 50 === 0 && count > 0) {
                console.log(`... ${count} mots de passe hachés`)
            }
            count++
        } else {
            alreadyHashed++
        }
    }

    console.log(`\n✨ Terminé !`)
    console.log(`✅ Nouveaux mots de passe hachés : ${count}`)
    console.log(`⏭️  Déjà hachés : ${alreadyHashed}`)
}

hashAllPasswords()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
