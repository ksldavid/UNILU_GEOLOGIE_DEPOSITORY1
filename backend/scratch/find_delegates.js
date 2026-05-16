const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const delegates = await prisma.user.findMany({
    where: { isChefDePromo: true },
    select: { id: true, name: true, studentEnrollments: { select: { academicLevelId: true } } }
  });
  console.log(JSON.stringify(delegates, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
