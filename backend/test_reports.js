const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const month = "2026-08";
    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
    const dateFilter = { created_at: { gte: startDate, lte: endDate } };

    const transactions = await prisma.transaction.findMany({
      where: {
        status_pembayaran: 'Lunas',
        ...dateFilter
      },
      select: {
        total_amount: true,
        sales_commission: true
      }
    });

    console.log(transactions);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
