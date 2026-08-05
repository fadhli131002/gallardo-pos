const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tx = await prisma.transaction.findUnique({ where: { id: 44 } });
  console.log(tx);
}

main().finally(() => prisma.$disconnect());
