const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tx = await prisma.transaction.findUnique({
    where: { id: 29 }
  });
  console.log('Transaction 29:', tx);

  const receivables = await prisma.transaction.findMany({
    where: { sisa_tagihan: { gt: 0 } }
  });
  console.log('Receivables:', receivables.length, receivables);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
