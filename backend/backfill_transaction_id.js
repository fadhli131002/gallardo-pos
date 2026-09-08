const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== BACKFILL transaction_id PADA CashFlowLog ===');
  const logs = await prisma.cashFlowLog.findMany();
  let updatedCount = 0;

  for (const log of logs) {
    if (log.referenceId && log.referenceId.startsWith('TRX-')) {
      const trxId = parseInt(log.referenceId.replace('TRX-', ''));
      if (!isNaN(trxId)) {
        // Cek apakah transaksi ada
        const exists = await prisma.transaction.findUnique({ where: { id: trxId } });
        if (exists) {
          await prisma.cashFlowLog.update({
            where: { id: log.id },
            data: { transaction_id: trxId }
          });
          updatedCount++;
        }
      }
    }
  }

  console.log(`Berhasil memperbarui ${updatedCount} baris CashFlowLog dengan transaction_id.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
