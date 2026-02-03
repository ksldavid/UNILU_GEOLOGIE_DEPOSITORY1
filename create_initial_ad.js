const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ad = await prisma.advertisement.create({
        data: {
            title: 'Bienvenue sur la Régie Pub UNILU',
            imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1611000000/sample.jpg', // Placeholder image
            linkUrl: 'https://unilu.ac.cd',
            pushTitle: 'Nouveau Service',
            pushBody: 'Découvrez notre nouvel espace publicitaire pour vos partenaires.',
            dailyLimit: 2,
        }
    });
    console.log('AD_CREATED:', ad.id);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
