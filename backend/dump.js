const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  const txs = await prisma.transaction.findMany({ include: { items: true } });
  fs.writeFileSync('txs.json', JSON.stringify(txs, null, 2));
}

main().finally(() => prisma.$disconnect());
