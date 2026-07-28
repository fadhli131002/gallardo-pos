const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Menghapus semua data terkait transaksi...");
  
  // Hapus data secara berurutan sesuai relasi
  await prisma.complaint.deleteMany();
  console.log("Complaint dihapus");

  await prisma.payment.deleteMany();
  console.log("Payment dihapus");

  await prisma.transactionItem.deleteMany();
  console.log("TransactionItem dihapus");

  await prisma.inventoryLog.deleteMany();
  console.log("InventoryLog dihapus");

  await prisma.cashFlowLog.deleteMany();
  console.log("CashFlowLog dihapus");
  
  await prisma.transaction.deleteMany();
  console.log("Transaction dihapus");

  await prisma.expense.deleteMany();
  console.log("Expense dihapus");

  await prisma.purchaseOrder.deleteMany();
  console.log("PurchaseOrder dihapus");

  console.log("Semua data transaksi berhasil dihapus!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
