const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
  const startDate = new Date('2026-09-01T00:00:00.000Z');
  const endDate = new Date('2026-09-30T23:59:59.999Z');

  const logs = await prisma.cashFlowLog.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      type: 'IN'
    },
    orderBy: { date: 'asc' }
  });

  console.log('=== AUDIT CASH FLOW IN SEPTEMBER 2026 ===');
  console.log('Total Count:', logs.length);
  const totalAmount = logs.reduce((sum, l) => sum + l.amount, 0);
  console.log('Total Amount:', totalAmount.toLocaleString('id-ID'));

  let linkedToCurrentMonthTrx = 0;
  let linkedToPastMonthTrx = 0;
  let unlinkedOrOrphan = 0;

  const rows = [];

  for (const l of logs) {
    let cleanRef = l.referenceId ? l.referenceId.replace('TRX-', '') : null;
    let trxId = cleanRef && !isNaN(Number(cleanRef)) ? Number(cleanRef) : null;
    let trx = trxId ? await prisma.transaction.findUnique({ 
      where: { id: trxId },
      include: { payments: true }
    }) : null;

    let category = 'UNLINKED / NO_TRX';
    if (trx) {
      const trxMonth = trx.created_at.toISOString().slice(0, 7);
      if (trxMonth === '2026-09') {
        category = 'TRX_SEPTEMBER_2026';
        linkedToCurrentMonthTrx += l.amount;
      } else {
        category = `TRX_PAST_MONTH (${trxMonth})`;
        linkedToPastMonthTrx += l.amount;
      }
    } else {
      unlinkedOrOrphan += l.amount;
    }

    rows.push({
      logId: l.id,
      amount: l.amount,
      desc: l.description,
      refId: l.referenceId,
      date: l.date.toISOString().split('T')[0],
      category,
      trxId: trx ? trx.id : 'N/A',
      trxStatus: trx ? trx.status_pembayaran : 'ORPHAN / UNKNOWN',
      trxTotal: trx ? trx.total_amount : 0,
      trxCreated: trx ? trx.created_at.toISOString().split('T')[0] : 'N/A'
    });
  }

  console.log('\n--- RINGKASAN PEMETAAN KAS MASUK ---');
  console.log('1. Terhubung ke Transaksi September 2026 :', linkedToCurrentMonthTrx.toLocaleString('id-ID'));
  console.log('2. Terhubung ke Transaksi Bulan Lalu     :', linkedToPastMonthTrx.toLocaleString('id-ID'));
  console.log('3. TIDAK TERHUBUNG / ORPHAN / TANPA TRX  :', unlinkedOrOrphan.toLocaleString('id-ID'));
  console.log('Total Kas Masuk Terhitung                :', (linkedToCurrentMonthTrx + linkedToPastMonthTrx + unlinkedOrOrphan).toLocaleString('id-ID'));

  console.log('\n--- DETAIL BARIS TIDAK TERHUBUNG (ORPHAN DATA) ---');
  const orphanRows = rows.filter(r => r.category.includes('UNLINKED'));
  orphanRows.forEach(r => {
    console.log(`ID: ${r.logId} | Tgl: ${r.date} | Rp ${r.amount.toLocaleString('id-ID')} | Ref: ${r.refId} | Desc: ${r.desc}`);
  });
  console.log('Subtotal Orphan Data: Rp ' + orphanRows.reduce((s, r) => s + r.amount, 0).toLocaleString('id-ID'));

  console.log('\n--- SEMUA BARIS CASH FLOW LOG (IN) ---');
  console.table(rows.map(r => ({
    id: r.logId,
    tgl: r.date,
    amount: r.amount,
    refId: r.refId,
    category: r.category,
    trxId: r.trxId,
    trxStatus: r.trxStatus,
    desc: r.desc.length > 30 ? r.desc.substring(0, 30) + '...' : r.desc
  })));
}

audit().catch(console.error).finally(() => prisma.$disconnect());
