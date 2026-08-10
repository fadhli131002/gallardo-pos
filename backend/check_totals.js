const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const txs = await prisma.transaction.findMany({ where: { id: { in: [47, 53, 56] } } });
  console.log(JSON.stringify(txs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
