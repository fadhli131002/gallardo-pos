const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Revert Item Price for Tx 46 to 8.5M
  await prisma.transactionItem.update({
    where: { id: 49 },
    data: { price: 8500000 }
  });
  console.log('Reverted Tx 46 item price to 8.5M');

  // 2. Fix Transaction total_amount for Tx 46 to 5.5M (8.5M price - 3M discount)
  await prisma.transaction.update({
    where: { id: 46 },
    data: { total_amount: 5500000 }
  });
  console.log('Fixed Tx 46 total_amount to 5.5M');

  // 3. Delete orphaned CashFlowLogs for deleted transactions (TRX-47, TRX-53, TRX-56)
  await prisma.cashFlowLog.deleteMany({
    where: {
      id: { in: [79, 82, 85] }
    }
  });
  console.log('Deleted orphaned CashFlowLogs (7.5M total) for deleted transactions');
}

main().catch(console.error).finally(() => prisma.$disconnect());
