const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: [19, 20, 21, 22] }
      }
    });

    console.log(transactions);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
