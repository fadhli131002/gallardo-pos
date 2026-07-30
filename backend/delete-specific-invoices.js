const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fungsi untuk mereplikasi pembuatan String ID (WRK/...) seperti di frontend
const formatTransactionId = (trx) => {
  const isRetail = trx.type === 'RETAIL' ||
    (trx.customer_name && trx.customer_name.toLowerCase().includes('pelanggan umum')) ||
    (trx.items && trx.items.some(i => (i.product_name || '').toLowerCase().includes('roll')));

  const prefix = isRetail ? 'RTL' : 'WRK';
  const dateObj = new Date(trx.created_at || Date.now());
  const yy = String(dateObj.getFullYear()).slice(-2);
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');

  let prodIdStr = '001';
  const primaryItem = (trx.items || [])[0];
  if (primaryItem) {
    const pName = primaryItem.product_name || '';
    if (pName.includes('Matte')) prodIdStr = '002';
    else if (pName.includes('Armor')) prodIdStr = '003';
    else if (pName.includes('Super Safe')) prodIdStr = '004';
    else if (pName.includes('Color')) prodIdStr = '005';
    else if (pName.includes('Iron Black 35')) prodIdStr = '010';
    else if (pName.includes('Iron Black 20')) prodIdStr = '011';
    else if (pName.includes('Iron Black 05')) prodIdStr = '012';
    else if (pName.includes('Aplikator')) prodIdStr = '023';
  }

  const seqNum = String(trx.id || 0).padStart(4, '0');
  return `${prefix}/${yy}${mm}${prodIdStr}${seqNum}`;
};

async function main() {
  // Target pencarian berupa string invoice persis
  const targetStringIds = ["WRK/26070010003", "WRK/26070010004", "WRK/26070010005"];
  
  console.log(`\n=== Memulai proses pencarian dan CASCADING DELETE ===`);
  console.log(`Target String ID: ${targetStringIds.join(', ')}\n`);

  // 1. Lakukan findMany karena ID String (WRK/...) dihasilkan secara dinamis (tidak tersimpan langsung di tabel Transaction)
  const allTransactions = await prisma.transaction.findMany({
    include: { items: true } // Sertakan items karena dibutuhkan untuk mendeteksi prodIdStr (001, 002, dst)
  });

  // 2. Filter data untuk mendapatkan Primary Key (id) aslinya
  const matchedTransactions = allTransactions.filter(trx => {
    const formatted = formatTransactionId(trx);
    return targetStringIds.includes(formatted);
  });

  if (matchedTransactions.length === 0) {
    console.log("[INFO] Tidak ada transaksi yang cocok dengan format string ID tersebut di database.");
    return;
  }

  // 3. Proses hapus cascading setelah mendapatkan PK id aslinya
  for (const trx of matchedTransactions) {
    const id = trx.id;
    const formattedId = formatTransactionId(trx);
    
    console.log(`[PROSES] Menemukan transaksi: ${formattedId}`);
    console.log(`  -> Primary Key Asli (id): ${id}`);
    console.log(`  -> Memulai penghapusan relasi...`);
    
    // Hapus Payment
    const delPay = await prisma.payment.deleteMany({ where: { transaction_id: id } });
    console.log(`  - ${delPay.count} Payment dihapus.`);

    // Hapus TransactionItem
    const delItem = await prisma.transactionItem.deleteMany({ where: { transaction_id: id } });
    console.log(`  - ${delItem.count} TransactionItem dihapus.`);

    // Hapus Complaint
    const delComp = await prisma.complaint.deleteMany({ where: { transaction_id: id } });
    console.log(`  - ${delComp.count} Complaint dihapus.`);

    // Hapus InventoryLog
    const delInvLog = await prisma.inventoryLog.deleteMany({ where: { transaction_id: id } });
    console.log(`  - ${delInvLog.count} InventoryLog dihapus.`);

    // Hapus CashFlowLog
    const delCashFlow = await prisma.cashFlowLog.deleteMany({ where: { referenceId: String(id) } });
    console.log(`  - ${delCashFlow.count} CashFlowLog dihapus.`);

    // Hapus Transaction
    await prisma.transaction.delete({ where: { id } });
    console.log(`[SUKSES] Transaksi ${formattedId} berhasil dihapus beserta seluruh relasinya.\n`);
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
