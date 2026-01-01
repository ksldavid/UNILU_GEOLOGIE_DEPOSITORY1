import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const levels = await prisma.academicLevel.findMany({
        orderBy: { order: 'asc' }
    })
    console.log("--- ACADEMIC LEVELS ---")
    levels.forEach(l => {
        console.log(`ID: ${l.id} | Code: ${l.code} | Name: ${l.name} | Order: ${l.order}`)
    })
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
