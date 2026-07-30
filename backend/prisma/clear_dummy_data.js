const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Memulai penghapusan data transaksi dummy...");

  // Hapus semua data yang berhubungan dengan transaksi
  await prisma.complaint.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.transactionItem.deleteMany({});
  
  // Hapus log inventaris dan cashflow yang terkait transaksi
  await prisma.inventoryLog.deleteMany({});
  await prisma.cashFlowLog.deleteMany({});
  
  // Hapus transaksi utamanya
  await prisma.transaction.deleteMany({});

  console.log("✅ Semua data transaksi & customer dummy berhasil dihapus.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
