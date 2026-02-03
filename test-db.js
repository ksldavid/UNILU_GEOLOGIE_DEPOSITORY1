
const { PrismaClient } = require('@prisma/client')
const { withAccelerate } = require('@prisma/extension-accelerate')

async function test() {
    const prisma = new PrismaClient().$extends(withAccelerate())
    try {
        console.log('Connecting to database...')
        const count = await prisma.user.count()
        console.log('User count:', count)
    } catch (err) {
        console.error('Error details:', JSON.stringify(err, null, 2))
        console.error('Error message:', err.message)
        console.error('Error code:', err.code)
    } finally {
        await prisma.$disconnect()
    }
}

test()
