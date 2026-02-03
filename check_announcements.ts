
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const announcements = await prisma.announcement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            author: { select: { name: true } }
        }
    })
    console.log('Latest Announcements:', JSON.stringify(announcements, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
