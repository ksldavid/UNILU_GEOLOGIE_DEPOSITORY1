const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkColumns() {
    const result = await prisma.$queryRaw`
    SELECT column_name, data_type, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'User'
  `;
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
}

checkColumns().catch(err => {
    console.error(err);
    process.exit(1);
});
