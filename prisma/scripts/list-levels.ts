
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const levels = await prisma.academicLevel.findMany()
    console.log(JSON.stringify(levels, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
