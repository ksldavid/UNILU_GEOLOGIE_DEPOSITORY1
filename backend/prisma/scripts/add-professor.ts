import { PrismaClient, SystemRole, CourseRole } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    // --- CONFIGURATION ---
    const id = 'PROF-001' // ID/Matricule unique (Requis par le schéma)
    const email = 'nouveau.prof@unilu.cd'
    const password = 'password123'
    const name = 'Pierre Durand' // Le schéma utilise 'name' au lieu de firstName/lastName
    const courseCodeToAssign = 'GEOL_100' // Changez ceci si vous voulez l'assigner directement à un cours
    const assignToCourse = false // Mettez à true pour activer l'assignation
    // ---------------------

    console.log("🔄 Création du compte utilisateur...")

    // 1. Vérifier si l'email ou l'ID existe déjà
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email },
                { id }
            ]
        }
    })
    if (existingUser) {
        console.error(`❌ Un utilisateur avec l'email ${email} ou l'ID ${id} existe déjà.`)
        return
    }

    // 2. Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // 3. Créer l'utilisateur
    // NOTE: Le SystemRole est 'USER'. Dans votre système, la distinction Professeur vs Assistant 
    // se fait souvent au niveau de l'inscription à un cours (CourseEnrollment).
    const user = await prisma.user.create({
        data: {
            id,
            email,
            password: hashedPassword,
            name,
            systemRole: SystemRole.USER, // Un professeur est un User standard au niveau système
        }
    })

    console.log(`✅ Utilisateur créé avec succès !`)
    console.log(`👤 Nom : ${user.name}`)
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
                    academicYear: '2025-2026' // À adapter selon l'année en cours
                }
            })
            console.log(`✅ ${user.name} est maintenant officiellement PROFESSEUR du cours ${courseCodeToAssign}.`)
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
