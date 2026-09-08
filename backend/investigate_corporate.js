const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigate() {
  const startDate = new Date('2026-09-01T00:00:00.000Z');
  const endDate = new Date('2026-09-30T23:59:59.999Z');

  console.log('================================================================');
  console.log('   INVESTIGASI FORENSIK KAS & ARSITEKTUR DATABASE POS-GALLARDO   ');
  console.log('   PERIODE: SEPTEMBER 2026                                      ');
  console.log('================================================================\n');

  // 1. Ambil semua CashFlowLog IN September 2026
  const cashLogs = await prisma.cashFlowLog.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      type: 'IN'
    },
    orderBy: { id: 'asc' }
  });

  console.log(`[1] TOTAL CASH FLOW LOG (IN): ${cashLogs.length} transaksi`);
  const totalCashIn = cashLogs.reduce((sum, l) => sum + l.amount, 0);
  console.log(`    Total Nominal: Rp ${totalCashIn.toLocaleString('id-ID')}\n`);

  // 2. Telusuri setiap baris CashFlowLog terhadap tabel Transaction dan Payment
  const auditReport = [];
  let sumCurrentMonthTrx = 0;
  let sumPastMonthTrx = 0;
  let sumOrphanUnlinked = 0;

  for (const log of cashLogs) {
    let cleanRef = log.referenceId ? log.referenceId.replace('TRX-', '') : null;
    let trxId = cleanRef && !isNaN(Number(cleanRef)) ? Number(cleanRef) : null;
    
    let trx = null;
    let payments = [];
    if (trxId) {
      trx = await prisma.transaction.findUnique({
        where: { id: trxId },
        include: { items: true, payments: true }
      });
      if (trx) {
        payments = trx.payments;
      }
    }

    let statusRelasi = 'ORPHAN / UNLINKED (TIDAK ADA DI TRANSAKSI)';
    let trxDateStr = '-';
    let trxMonth = '-';
    let trxCustomer = '-';
    let trxStatus = '-';
    let trxTotal = 0;
    let trxSisa = 0;

    if (trx) {
      trxDateStr = trx.created_at.toISOString().split('T')[0];
      trxMonth = trx.created_at.toISOString().slice(0, 7);
      trxCustomer = trx.customer_name || 'Umum';
      trxStatus = trx.status_pembayaran;
      trxTotal = trx.total_amount;
      trxSisa = trx.sisa_tagihan;

      if (trxMonth === '2026-09') {
        statusRelasi = 'VALID - INVOICE BULAN INI (SEPTEMBER 2026)';
        sumCurrentMonthTrx += log.amount;
      } else {
        statusRelasi = `VALID - INVOICE BULAN LALU (${trxMonth}) [PELUNASAN PIUTANG]`;
        sumPastMonthTrx += log.amount;
      }
    } else {
      sumOrphanUnlinked += log.amount;
    }

    auditReport.push({
      logId: log.id,
      date: log.date.toISOString().split('T')[0],
      amount: log.amount,
      refId: log.referenceId || 'NULL',
      desc: log.description,
      statusRelasi,
      trxId: trxId || 'N/A',
      trxDate: trxDateStr,
      trxCustomer,
      trxStatus,
      trxTotal,
      trxSisa,
      paymentCount: payments.length
    });
  }

  // 3. Tampilkan Tabel Lengkap
  console.log('=== DAFTAR DETAIL SEMUA LOG KAS MASUK PEMBENTUK RP 522.630.000 ===');
  console.table(auditReport.map(r => ({
    'ID Log': r.logId,
    'Tgl Log': r.date,
    'Nominal (Rp)': r.amount.toLocaleString('id-ID'),
    'Ref ID': r.refId,
    'Trx ID': r.trxId,
    'Tgl Inv': r.trxDate,
    'Customer': r.trxCustomer.length > 15 ? r.trxCustomer.slice(0, 15) : r.trxCustomer,
    'Status Inv': r.trxStatus,
    'Klasifikasi': r.statusRelasi.includes('SEPTEMBER') ? 'Invoice Bulan Ini' : (r.statusRelasi.includes('BULAN LALU') ? 'Piutang Masa Lalu' : '⚠️ ORPHAN DATA')
  })));

  // 4. Rekapitulasi Matematis
  console.log('\n================================================================');
  console.log('   REKAPITULASI PEMETAAN KAS MASUK (RECONCILIATION BREAKDOWN)   ');
  console.log('================================================================');
  console.log(`1. Uang Masuk dari Invoice Bulan Ini (Sep 2026) : Rp ${sumCurrentMonthTrx.toLocaleString('id-ID')}`);
  console.log(`2. Uang Masuk dari Pelunasan Invoice Bulan Lalu : Rp ${sumPastMonthTrx.toLocaleString('id-ID')}`);
  console.log(`3. Uang Masuk ORPHAN / TANPA INVOICE            : Rp ${sumOrphanUnlinked.toLocaleString('id-ID')}`);
  console.log(`----------------------------------------------------------------`);
  console.log(`TOTAL KAS MASUK RIIL                            : Rp ${(sumCurrentMonthTrx + sumPastMonthTrx + sumOrphanUnlinked).toLocaleString('id-ID')}`);

  // 5. Cek Semua Invoice Bulan September 2026
  console.log('\n================================================================');
  console.log('   ANALISIS INVOICE BULAN SEPTEMBER 2026 (AKRUAL)               ');
  console.log('================================================================');
  const septInvoices = await prisma.transaction.findMany({
    where: {
      created_at: { gte: startDate, lte: endDate }
    },
    include: { payments: true }
  });

  const totalOmsetSept = septInvoices.reduce((s, t) => s + t.total_amount, 0);
  const totalSisaSept = septInvoices.reduce((s, t) => s + t.sisa_tagihan, 0);
  const totalKasTerbayarSept = septInvoices.reduce((s, t) => s + (t.total_amount - t.sisa_tagihan), 0);

  console.log(`Total Invoice September Dibuat : ${septInvoices.length} transaksi`);
  console.log(`Total Omset Akrual September   : Rp ${totalOmsetSept.toLocaleString('id-ID')}`);
  console.log(`Total Belum Lunas (Piutang Baru): Rp ${totalSisaSept.toLocaleString('id-ID')}`);
  console.log(`Total Kas Terbayar dr Inv Sept : Rp ${totalKasTerbayarSept.toLocaleString('id-ID')}`);

  // 6. Cek Detail Baris Orphan
  console.log('\n================================================================');
  console.log('   DAFTAR BARIS ORPHAN DATA (LOG KAS TANPA TRANSAKSI)           ');
  console.log('================================================================');
  const orphans = auditReport.filter(r => r.statusRelasi.includes('ORPHAN'));
  orphans.forEach((o, idx) => {
    console.log(`${idx + 1}. Log ID: ${o.logId} | Tgl: ${o.date} | Ref: ${o.refId} | Rp ${o.amount.toLocaleString('id-ID')} | Keterangan: ${o.desc}`);
  });
  console.log(`Total Uang Orphan: Rp ${orphans.reduce((s, o) => s + o.amount, 0).toLocaleString('id-ID')}`);

  // 7. Cek Tabel Payment
  console.log('\n================================================================');
  console.log('   AUDIT TABEL PAYMENT BULAN SEPTEMBER 2026                     ');
  console.log('================================================================');
  const septPayments = await prisma.payment.findMany({
    where: {
      payment_date: { gte: startDate, lte: endDate }
    },
    include: { transaction: true }
  });
  const totalPaymentAmount = septPayments.reduce((s, p) => s + p.amount, 0);
  console.log(`Total Record Payment : ${septPayments.length}`);
  console.log(`Total Nominal Payment: Rp ${totalPaymentAmount.toLocaleString('id-ID')}`);

  let paymentFromCurTrx = 0;
  let paymentFromPastTrx = 0;
  for (const p of septPayments) {
    const trxMonth = p.transaction.created_at.toISOString().slice(0, 7);
    if (trxMonth === '2026-09') paymentFromCurTrx += p.amount;
    else paymentFromPastTrx += p.amount;
  }
  console.log(`- Dari Transaksi September 2026: Rp ${paymentFromCurTrx.toLocaleString('id-ID')}`);
  console.log(`- Dari Transaksi Bulan Lalu    : Rp ${paymentFromPastTrx.toLocaleString('id-ID')}`);
}

investigate().catch(console.error).finally(() => prisma.$disconnect());
