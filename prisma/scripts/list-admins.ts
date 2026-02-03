import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const admins = await prisma.user.findMany({
        where: { systemRole: 'ADMIN' },
        include: { adminProfile: true }
    })
    console.log(JSON.stringify(admins, null, 2))
}
main().finally(() => prisma.$disconnect())
