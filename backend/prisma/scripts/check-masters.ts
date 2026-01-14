
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const ids = ['0125010036', '0125010042', '0125010709']
    const users = await prisma.user.findMany({
        where: { id: { in: ids } }
    })
    console.log(`Found ${users.length} users:`)
    console.log(JSON.stringify(users, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
