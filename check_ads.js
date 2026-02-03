const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ads = await prisma.advertisement.findMany();
    console.log('ADS_COUNT:' + ads.length);
    console.log(JSON.stringify(ads, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
