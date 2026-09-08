const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== MEMULAI DATA CLEANSING ORPHAN CASHFLOW ===');
  const targetIds = [174, 182, 184, 185, 186, 187, 188, 189, 190, 191, 192, 329, 334];

  // 1. Ambil data sebelum dihapus untuk verifikasi audit
  const records = await prisma.cashFlowLog.findMany({
    where: { id: { in: targetIds } }
  });

  console.log(`Ditemukan ${records.length} baris orphan data untuk dihapus.`);
  const totalAmount = records.reduce((s, r) => s + r.amount, 0);
  console.log(`Total nominal orphan yang akan dibersihkan: Rp ${totalAmount.toLocaleString('id-ID')}`);

  // 2. Eksekusi penghapusan
  const deleteResult = await prisma.cashFlowLog.deleteMany({
    where: { id: { in: targetIds } }
  });

  console.log(`Berhasil menghapus ${deleteResult.count} baris dari tabel CashFlowLog.`);

  // 3. Verifikasi sisa Kas Masuk September 2026
  const startDate = new Date('2026-09-01T00:00:00.000Z');
  const endDate = new Date('2026-09-30T23:59:59.999Z');

  const remainingLogs = await prisma.cashFlowLog.findMany({
    where: {
      type: 'IN',
      date: { gte: startDate, lte: endDate }
    }
  });

  const remainingTotal = remainingLogs.reduce((s, r) => s + r.amount, 0);
  console.log(`Sisa baris valid CashFlowLog (IN) September 2026: ${remainingLogs.length}`);
  console.log(`Total Kas Masuk Riil Baru: Rp ${remainingTotal.toLocaleString('id-ID')}`);

  if (remainingTotal === 236030000) {
    console.log('✅ VERIFIKASI BERHASIL: Total Kas Masuk terkoreksi sempurna ke Rp 236.030.000!');
  } else {
    console.warn('⚠️ PERINGATAN: Total Kas Masuk berbeda dengan ekspektasi Rp 236.030.000');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
