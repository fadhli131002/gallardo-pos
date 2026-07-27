const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPendingTrx() {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        id: {
          in: [19, 20, 22]
        }
      },
      select: {
        id: true,
        type: true,
        status_pembayaran: true,
        total_amount: true,
        sisa_tagihan: true,
        customer_name: true
      }
    });

    console.log("=== TRANSACTIONS DETAIL (19, 20, 22) ===");
    console.table(transactions);
    
  } catch (error) {
    console.error("Error fetching transactions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPendingTrx();
