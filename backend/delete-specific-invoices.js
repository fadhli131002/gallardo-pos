const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Transaksi ID yang akan dihapus berdasarkan string ID:
  // WRK/26070010003 -> id: 3
  // WRK/26070010004 -> id: 4
  // WRK/26070010005 -> id: 5
  const targetIds = [3, 4, 5];

  console.log(`\n=== Memulai proses CASCADING DELETE ===`);
  console.log(`Target ID Transaksi: ${targetIds.join(', ')}\n`);

  for (const id of targetIds) {
    const trx = await prisma.transaction.findUnique({ where: { id } });
    if (!trx) {
      console.log(`[SKIPPED] Transaksi ID ${id} tidak ditemukan di database.`);
      continue;
    }

    console.log(`[PROSES] Menghapus data relasi untuk Transaksi ID ${id}...`);
    
    // 1. Hapus Payment
    const delPay = await prisma.payment.deleteMany({ where: { transaction_id: id } });
    console.log(`  - ${delPay.count} Payment dihapus.`);

    // 2. Hapus TransactionItem
    const delItem = await prisma.transactionItem.deleteMany({ where: { transaction_id: id } });
    console.log(`  - ${delItem.count} TransactionItem dihapus.`);

    // 3. Hapus Complaint
    const delComp = await prisma.complaint.deleteMany({ where: { transaction_id: id } });
    console.log(`  - ${delComp.count} Complaint dihapus.`);

    // 4. Hapus InventoryLog
    const delInvLog = await prisma.inventoryLog.deleteMany({ where: { transaction_id: id } });
    console.log(`  - ${delInvLog.count} InventoryLog dihapus.`);

    // 5. Hapus CashFlowLog
    // Catatan: CashFlowLog menyimpan referenceId dalam bentuk String.
    const delCashFlow = await prisma.cashFlowLog.deleteMany({ 
      where: { referenceId: String(id) } 
    });
    console.log(`  - ${delCashFlow.count} CashFlowLog dihapus.`);

    // 6. Hapus Transaction Induk
    await prisma.transaction.delete({ where: { id } });
    console.log(`[SUKSES] Transaksi ID ${id} berhasil dihapus beserta seluruh relasinya.\n`);
  }

  console.log("=== Proses CASCADING DELETE selesai ===");
}

main()
  .catch(e => {
    console.error("Terjadi error saat menghapus:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
