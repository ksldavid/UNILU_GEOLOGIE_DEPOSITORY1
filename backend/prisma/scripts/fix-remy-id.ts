import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = "remyluabeyatshishimbi@gmail.com"
    const oldId = "REM51226"

    console.log(`Checking for user with email: ${email} or ID: ${oldId}`)

    const userByEmail = await prisma.user.findUnique({
        where: { email: email }
    })

    if (userByEmail) {
        console.log(`Found user by email: ${userByEmail.id}, ${userByEmail.name}`)
        // Delete related records first if necessary? Prisma usually handles cascade if configured, 
        // but let's see. StudentEnrollment might block deletion.

        // Delete enrollments
        await prisma.studentEnrollment.deleteMany({
            where: { userId: userByEmail.id }
        })
        console.log("Deleted enrollments for user.")

        // Delete user
        await prisma.user.delete({
            where: { id: userByEmail.id }
        })
        console.log(`Deleted user with ID ${userByEmail.id}`)
    } else {
        console.log("User not found by email.")
    }

    const userById = await prisma.user.findUnique({
        where: { id: oldId }
    })

    if (userById) {
        console.log(`Found user by ID: ${userById.id}, ${userById.name}`)
        // Delete enrollments
        await prisma.studentEnrollment.deleteMany({
            where: { userId: userById.id }
        })
        console.log("Deleted enrollments for user.")

        await prisma.user.delete({
            where: { id: oldId }
        })
        console.log(`Deleted user with ID ${oldId}`)
    } else {
        console.log("User not found by ID (already deleted or never existed).")
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
