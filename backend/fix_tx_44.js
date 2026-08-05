const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tx = await prisma.transaction.findUnique({ where: { id: 44 } });
  if (tx) {
    await prisma.transaction.update({
      where: { id: 44 },
      data: { discount: 2000000 }
    });
    console.log('Updated transaction 44 with discount 2000000');
  } else {
    console.log('Transaction 44 not found');
  }
}

main().finally(() => prisma.$disconnect());
