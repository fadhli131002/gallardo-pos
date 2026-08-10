const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const startDate = new Date('2026-08-01T00:00:00.000Z');
  const endDate = new Date('2026-08-31T23:59:59.999Z');

  const txs = await prisma.transaction.findMany({
    where: { created_at: { gte: startDate, lte: endDate }, status_pembayaran: 'Lunas' }
  });

  const cfs = await prisma.cashFlowLog.findMany({
    where: { date: { gte: startDate, lte: endDate }, type: 'IN' }
  });

  for (const t of txs) {
    // try to match referenceId TRX-ID
    const txCfs = cfs.filter(c => c.referenceId === `TRX-${t.id}` || c.transaction_id === t.id);
    const sumTxCf = txCfs.reduce((s, c) => s + c.amount, 0);
    if (sumTxCf !== t.total_amount) {
      console.log(`BEDA! Transaksi ID: ${t.id}, Total Invoice: ${t.total_amount}, Tapi tercatat di Kas Masuk: ${sumTxCf}`);
    }
  }
}
check();
