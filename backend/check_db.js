const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trxs = await prisma.transaction.findMany({
    take: 5,
    orderBy: { created_at: 'desc' },
    include: { inventory_logs: true }
  });
  console.log("=== TRANSACTIONS ===");
  console.log(JSON.stringify(trxs.map(t => ({
    id: t.id,
    status: t.status_pembayaran,
    type: t.payment_type,
    sisa: t.sisa_tagihan,
    total: t.total_amount,
    date: t.created_at,
    inventoryLogsCount: t.inventory_logs.length
  })), null, 2));

  const expenses = await prisma.expense.findMany();
  console.log("=== EXPENSES ===");
  console.log("Count:", expenses.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
