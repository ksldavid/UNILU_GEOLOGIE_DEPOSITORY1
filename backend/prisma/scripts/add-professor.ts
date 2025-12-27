import { PrismaClient, SystemRole, CourseRole } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    // --- CONFIGURATION ---
    const email = 'nouveau.prof@unilu.cd'
    const password = 'password123'
    const firstName = 'Pierre'
    const lastName = 'Durand'
    const courseCodeToAssign = 'GEOL_100' // Changez ceci si vous voulez l'assigner directement à un cours
    const assignToCourse = false // Mettez à true pour activer l'assignation
    // ---------------------

    console.log("🔄 Création du compte utilisateur...")

    // 1. Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
        console.error(`❌ Un utilisateur avec l'email ${email} existe déjà.`)
        return
    }

    // 2. Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // 3. Créer l'utilisateur
    // NOTE: Le SystemRole est 'USER'. Dans votre système, la distinction Professeur vs Assistant 
    // se fait souvent au niveau de l'inscription à un cours (CourseEnrollment).
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            systemRole: SystemRole.USER, // Un professeur est un User standard au niveau système
        }
    })

    console.log(`✅ Utilisateur créé avec succès !`)
    console.log(`👤 Nom : ${user.firstName} ${user.lastName}`)
    console.log(`📧 Email : ${user.email}`)
    console.log(`🔑 Role Système : ${user.systemRole} (Normal, ce n'est pas ici qu'on distingue Prof/Assistant)`)

    // 4. (Optionnel) Assigner à un cours en tant que PROFESSUR
    if (assignToCourse) {
        console.log(`\n🔄 Tentative d'assignation au cours ${courseCodeToAssign} en tant que PROFESSEUR...`)

        // Vérifier si le cours existe
        const course = await prisma.course.findUnique({ where: { code: courseCodeToAssign } })
        if (!course) {
            console.error(`❌ Le cours ${courseCodeToAssign} n'existe pas. Impossible d'assigner.`)
        } else {
            await prisma.courseEnrollment.create({
                data: {
                    userId: user.id,
                    courseCode: courseCodeToAssign,
                    role: CourseRole.PROFESSOR, // <--- C'EST ICI LA CLÉ : On force le rôle PROFESSOR
                    academicYear: '2024-2025' // À adapter selon l'année en cours
                }
            })
            console.log(`✅ ${user.firstName} est maintenant officiellement PROFESSEUR du cours ${courseCodeToAssign}.`)
        }
    } else {
        console.log(`\nℹ️  L'utilisateur n'est pas encore assigné à un cours.`)
        console.log(`Pour le définir comme Professeur, vous devrez l'inscrire à un cours avec le rôle 'PROFESSOR'.`)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
