const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkItems() {
  try {
    const items = await prisma.transactionItem.findMany({
      where: { transaction_id: { in: [19, 20] } }
    });
    console.log(items);
  } finally {
    await prisma.$disconnect();
  }
}

checkItems();
