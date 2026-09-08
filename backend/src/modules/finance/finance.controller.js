const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Buat filter date range berdasarkan string period.
 * Returns { startDate, endDate } sebagai Date objects.
 */
function buildDateRange(startDateStr, endDateStr) {
  if (startDateStr && endDateStr) {
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);
    return { startDate: new Date(startDateStr), endDate: end };
  }
  // Default: hari ini
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return { startDate: start, endDate: end };
}

/**
 * Hitung summary P&L dan Cashflow untuk satu periode (startDate..endDate).
 * Returns { totalOmset, totalHpp, totalKomisi, totalBeban, labaKotor, labaBersih, kasMasuk, kasKeluar, netCashflow, totalPembelian, totalTerkumpul, totalDiskon }.
 */
async function calcPeriodSummary(startDate, endDate) {
  const createdFilter = { gte: startDate, lte: endDate };
  const dateFilter    = { gte: startDate, lte: endDate };

  // ── Akrual P&L ──────────────────────────────────────────────────────────
  const transactions = await prisma.transaction.findMany({
    where: { created_at: createdFilter, status_pembayaran: { not: 'Batal' } },
    select: { total_amount: true, sales_commission: true, status_pembayaran: true, discount: true }
  });

  let totalOmset = 0;
  let totalKomisi = 0;
  let totalDiskon = 0;
  transactions.forEach(t => {
    totalOmset += t.total_amount || 0;
    totalDiskon += t.discount || 0;
    if (t.status_pembayaran === 'Lunas' || t.status_pembayaran === 'LUNAS') {
      totalKomisi += t.sales_commission !== null ? t.sales_commission : ((t.total_amount || 0) * 0.05);
    }
  });

  const inventoryLogs = await prisma.inventoryLog.findMany({
    where: { jenis: 'DEDUCT', transaction_id: { not: null }, created_at: createdFilter },
    include: { inventory: true }
  });

  let totalHpp = 0;
  for (const log of inventoryLogs) {
    if (log.inventory && log.inventory.harga_modal) {
      const konversi = log.inventory.konversi || 1;
      totalHpp += log.jumlah * (log.inventory.harga_modal / konversi);
    }
  }

  const expensesAgg = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: { date: dateFilter }
  });
  const totalBeban = expensesAgg._sum.amount || 0;

  const labaKotor  = totalOmset - totalHpp;
  const labaBersih = totalOmset - totalHpp - totalBeban - totalKomisi;

  // ── Cashflow Riil ────────────────────────────────────────────────────────
  const cashInAgg = await prisma.cashFlowLog.aggregate({
    _sum: { amount: true },
    where: { type: 'IN', date: dateFilter }
  });
  const kasMasuk = cashInAgg._sum.amount || 0;

  const cashOutAgg = await prisma.cashFlowLog.aggregate({
    _sum: { amount: true },
    where: { type: 'OUT', date: dateFilter }
  });
  const kasKeluar = cashOutAgg._sum.amount || 0;

  const netCashflow = kasMasuk - kasKeluar;

  // ── Lain-lain ────────────────────────────────────────────────────────────
  const poAgg = await prisma.purchaseOrder.aggregate({
    _sum: { totalAmount: true },
    where: { date: dateFilter }
  });
  const totalPembelian = poAgg._sum.totalAmount || 0;

  // ── Pemisahan Uang Masuk: Kas Invoice Berjalan vs Pelunasan Piutang Lama ──
  const periodPayments = await prisma.payment.findMany({
    where: { payment_date: dateFilter },
    include: {
      transaction: {
        select: { id: true, created_at: true }
      }
    }
  });

  const periodStart = startDate instanceof Date ? startDate : new Date(startDate);
  let pelunasanPiutangLama = 0;
  let kasBulanIni = 0;

  for (const p of periodPayments) {
    if (p.transaction && p.transaction.created_at < periodStart) {
      pelunasanPiutangLama += p.amount;
    } else {
      kasBulanIni += p.amount;
    }
  }

  const totalTerkumpul = kasBulanIni + pelunasanPiutangLama;

  return { 
    totalOmset, 
    totalHpp, 
    totalKomisi, 
    totalBeban, 
    labaKotor, 
    labaBersih, 
    kasMasuk, 
    kasKeluar, 
    netCashflow, 
    totalPembelian, 
    totalTerkumpul, 
    totalDiskon,
    pelunasanPiutangLama,
    kasBulanIni
  };
}

/**
 * Hitung persentase MoM.
 * Jika thisMonth = 0 dan lastMonth = 0 → null (N/A).
 * Jika lastMonth = 0 tapi thisMonth > 0 → null (N/A, data awal).
 */
function calcMoM(thisMonth, lastMonth) {
  if (lastMonth === 0) return null; // N/A — data bulan lalu kosong
  return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
}

// ── DASHBOARD KEUANGAN ───────────────────────────────────────────────────────
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const { startDate: sd, endDate: ed } = buildDateRange(startDate, endDate);

    // Hitung bulan lalu (untuk MoM comparison)
    const lastMonthStart = new Date(sd);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const lastMonthEnd = new Date(ed);
    lastMonthEnd.setMonth(lastMonthEnd.getMonth() - 1);

    // Jalankan kalkulasi periode ini dan bulan lalu secara paralel
    const [current, previous] = await Promise.all([
      calcPeriodSummary(sd, ed),
      calcPeriodSummary(lastMonthStart, lastMonthEnd),
    ]);

    // Piutang (all-time, no date filter)
    const receivablesAll = await prisma.transaction.aggregate({
      _sum: { sisa_tagihan: true },
      where: { sisa_tagihan: { gt: 0 } }
    });
    const totalPiutang = receivablesAll._sum.sisa_tagihan || 0;

    const receivablesPeriod = await prisma.transaction.aggregate({
      _sum: { sisa_tagihan: true },
      where: { created_at: { gte: sd, lte: ed }, sisa_tagihan: { gt: 0 } }
    });
    const totalPiutangPeriode = receivablesPeriod._sum.sisa_tagihan || 0;

    res.json({
      // ── P&L Akrual ──────────────────────────────────────────────────────
      pl: {
        totalOmset:  current.totalOmset,
        totalHpp:    current.totalHpp,
        totalBeban:  current.totalBeban,
        totalKomisi: current.totalKomisi,
        labaKotor:   current.labaKotor,
        labaBersih:  current.labaBersih,
      },
      // ── Cashflow Riil ────────────────────────────────────────────────────
      cashflow: {
        kasMasuk:             current.kasMasuk,
        kasKeluar:            current.kasKeluar,
        netCashflow:          current.netCashflow,
        totalPembelian:       current.totalPembelian,
        totalTerkumpul:       current.totalTerkumpul,
        pelunasanPiutangLama: current.pelunasanPiutangLama,
        kasBulanIni:          current.kasBulanIni,
      },
      // ── Piutang ─────────────────────────────────────────────────────────
      receivables: {
        totalPiutang,
        totalPiutangPeriode,
      },
      // ── MoM Comparison (null = N/A jika bulan lalu kosong) ──────────────
      momComparison: {
        omset:    { thisMonth: current.totalOmset,  lastMonth: previous.totalOmset,  pct: calcMoM(current.totalOmset,  previous.totalOmset) },
        kas:      { thisMonth: current.kasMasuk,    lastMonth: previous.kasMasuk,    pct: calcMoM(current.kasMasuk,    previous.kasMasuk) },
        laba:     { thisMonth: current.labaBersih,  lastMonth: previous.labaBersih,  pct: calcMoM(current.labaBersih,  previous.labaBersih) },
        cashflow: { thisMonth: current.netCashflow, lastMonth: previous.netCashflow, pct: calcMoM(current.netCashflow, previous.netCashflow) },
      },
      // ── Legacy fields (backward compat dengan FinanceDashboard.jsx lama) ─
      totalKasMasuk:      current.kasMasuk,
      totalPiutang,
      totalPiutangPeriode,
      labaRugi:           current.labaBersih,
      labaKotor:          current.labaKotor,
      totalOmset:         current.totalOmset,
      totalHpp:           current.totalHpp,
      totalKomisi:        current.totalKomisi,
      totalExpense:       current.totalBeban,
      totalPembelian:     current.totalPembelian,
      totalTerkumpul:     current.totalTerkumpul,
      pelunasanPiutangLama: current.pelunasanPiutangLama,
      kasBulanIni:          current.kasBulanIni,
      totalDiskon:        current.totalDiskon,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardDetails = async (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let dateFilter = { gte: today };
    let createdFilter = { gte: today };

    if (startDate && endDate) {
      dateFilter = { gte: new Date(startDate), lte: new Date(endDate) };
      createdFilter = { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (startDate) {
      dateFilter = { gte: new Date(startDate) };
      createdFilter = { gte: new Date(startDate) };
    }

    if (type === 'kas-masuk') {
      const logs = await prisma.cashFlowLog.findMany({
        where: { type: 'IN', date: dateFilter },
        include: {
          transaction: {
            select: { id: true, customer_name: true, plate_number: true, car_brand: true, car_model: true }
          }
        },
        orderBy: { date: 'desc' }
      });
      return res.json(logs);
    } else if (type === 'net-cashflow' || type === 'arus-kas' || type === 'cashflow') {
      const logs = await prisma.cashFlowLog.findMany({
        where: { date: dateFilter },
        include: {
          transaction: {
            select: { id: true, customer_name: true, plate_number: true, car_brand: true, car_model: true }
          }
        },
        orderBy: { date: 'desc' }
      });
      return res.json(logs);
    } else if (type === 'piutang') {
      const receivables = await prisma.transaction.findMany({
        where: { sisa_tagihan: { gt: 0 } },
        orderBy: { created_at: 'desc' },
        select: { id: true, customer_name: true, total_amount: true, sisa_tagihan: true, status_pembayaran: true, created_at: true }
      });
      return res.json(receivables);
    } else if (type === 'piutang-periode') {
      const receivables = await prisma.transaction.findMany({
        where: { created_at: createdFilter, sisa_tagihan: { gt: 0 } },
        orderBy: { created_at: 'desc' },
        select: { id: true, customer_name: true, total_amount: true, sisa_tagihan: true, status_pembayaran: true, created_at: true }
      });
      return res.json(receivables);
    } else if (type === 'terkumpul' || type === 'piutang-lama') {
      const isPiutangLama = type === 'piutang-lama';
      const payments = await prisma.payment.findMany({
        where: { payment_date: dateFilter },
        include: {
          transaction: {
            select: { id: true, customer_name: true, plate_number: true, total_amount: true, sisa_tagihan: true, created_at: true }
          }
        },
        orderBy: { payment_date: 'desc' }
      });

      const periodStart = dateFilter.gte instanceof Date ? dateFilter.gte : new Date(dateFilter.gte);
      const filteredPayments = isPiutangLama
        ? payments.filter(p => p.transaction && p.transaction.created_at < periodStart)
        : payments;

      return res.json(filteredPayments);
    } else if (type === 'beban') {
      const expensesList = await prisma.expense.findMany({
        where: { date: dateFilter },
        orderBy: { date: 'desc' }
      });
      return res.json(expensesList);
    } else if (type === 'komisi') {
      const commTrx = await prisma.transaction.findMany({
        where: { created_at: createdFilter, status_pembayaran: 'Lunas' },
        orderBy: { created_at: 'desc' },
        select: { id: true, customer_name: true, total_amount: true, sales_commission: true, event: true, created_at: true }
      });
      const commList = commTrx.map(t => ({
        id: t.id,
        customer_name: t.customer_name,
        sales_name: t.event || '-',
        total_amount: t.total_amount,
        commission: t.sales_commission !== null ? t.sales_commission : (t.total_amount * 0.05),
        created_at: t.created_at
      }));
      return res.json(commList);
    } else if (type === 'hpp') {
      const inventoryLogs = await prisma.inventoryLog.findMany({
        where: { 
          jenis: 'DEDUCT', 
          transaction_id: { not: null },
          created_at: createdFilter
        },
        include: { 
          inventory: true,
          transaction: {
            select: { id: true, customer_name: true, plate_number: true }
          }
        },
        orderBy: { created_at: 'desc' }
      });
      const hppList = inventoryLogs.map(log => {
        const konversi = log.inventory?.konversi || 1;
        const hargaModal = log.inventory?.harga_modal || 0;
        const totalModal = log.jumlah * (hargaModal / konversi);
        let displaySatuan = log.inventory?.satuan || 'Pcs';
        if (log.inventory?.satuan === 'Roll') displaySatuan = 'Meter';
        else if (log.inventory?.satuan === 'Botol') displaySatuan = 'ml';
        return {
          id: log.id,
          transaction_id: log.transaction?.id || log.transaction_id,
          product_name: `${log.inventory?.brand || ''} ${log.inventory?.varian || ''}`.trim() || 'Barang',
          jumlah: log.jumlah,
          satuan: displaySatuan,
          hargaModal,
          totalModal,
          customer_name: log.transaction?.customer_name || '-',
          plate_number: log.transaction?.plate_number || '-',
          created_at: log.created_at
        };
      });
      return res.json(hppList);
    } else if (type === 'omset' || type === 'laba-rugi') {
      const transactions = await prisma.transaction.findMany({
        where: { created_at: createdFilter, status_pembayaran: { not: 'Batal' } },
        include: {
          inventory_logs: {
            where: { jenis: 'DEDUCT' },
            include: { inventory: true }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      const enriched = transactions.map(trx => {
        let hpp = 0;
        trx.inventory_logs.forEach(log => {
          if (log.inventory && log.inventory.harga_modal) {
            const konversi = log.inventory.konversi || 1;
            hpp += (log.jumlah * (log.inventory.harga_modal / konversi));
          }
        });
        const COMMISSION_RATE = 0.05;
        const komisi = trx.sales_commission !== null ? trx.sales_commission : (trx.total_amount * COMMISSION_RATE);
        return {
          id: trx.id,
          customer_name: trx.customer_name,
          created_at: trx.created_at,
          total_amount: trx.total_amount,
          hpp: hpp,
          komisi: komisi,
          labaBersih: trx.total_amount - hpp - komisi
        };
      });
      return res.json(enriched);
    }

    res.status(400).json({ message: 'Invalid detail type' });
  } catch (error) {
    next(error);
  }
};

// PIUTANG PELANGGAN
exports.getReceivables = async (req, res, next) => {
  try {
    const receivables = await prisma.transaction.findMany({
      where: {
        OR: [
          { sisa_tagihan: { gt: 0 } },
          { status_pembayaran: { in: ['BELUM BAYAR', 'PROSES', 'DP', 'UNPAID', 'Proses', 'Belum Bayar', 'DP / Sebagian'] } }
        ]
      },
      include: { items: true, payments: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(receivables);
  } catch (error) {
    next(error);
  }
};

// REFUND
exports.processRefund = async (req, res, next) => {
  try {
    const { transactionId, refundAmount, refundReason } = req.body;
    const amount = Number(refundAmount) || 0;

    if (!transactionId) return res.status(400).json({ message: 'ID Transaksi wajib diisi' });

    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(transactionId) }
    });

    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    
    const totalPaid = transaction.total_amount - transaction.sisa_tagihan;
    if (amount <= 0) return res.status(400).json({ message: 'Nominal refund tidak valid' });
    if (amount > totalPaid) {
      return res.status(400).json({ message: `Nominal refund tidak boleh melebihi total uang yang sudah dibayar (Rp ${totalPaid.toLocaleString('id-ID')})` });
    }

    await prisma.$transaction(async (tx) => {
      const currentRefund = transaction.refund_amount || 0;
      await tx.transaction.update({
        where: { id: Number(transactionId) },
        data: {
          status_pembayaran: 'REFUND',
          refund_amount: currentRefund + amount,
          refund_reason: refundReason
        }
      });

      await tx.cashFlowLog.create({
        data: {
          type: 'OUT',
          amount: amount,
          description: `Refund transaksi TRX-${transactionId}: ${refundReason}`,
          referenceId: `REF-${transactionId}`
        }
      });
    });

    res.json({ message: 'Refund berhasil diproses' });
  } catch (error) {
    next(error);
  }
};

exports.getRefundHistory = async (req, res, next) => {
  try {
    const refunds = await prisma.transaction.findMany({
      where: { status_pembayaran: 'REFUND' },
      orderBy: { updated_at: 'desc' }
    });
    res.json(refunds);
  } catch (error) {
    next(error);
  }
};

// KOMISI SALES
exports.getSalesCommissions = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const COMMISSION_RATE = 0.05; // 5% Komisi

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else if (startDate) {
      dateFilter = { gte: new Date(startDate) };
    }

    // Ambil transaksi LUNAS dan filter tanggal jika ada
    const transactions = await prisma.transaction.findMany({
      where: {
        status_pembayaran: { in: ['LUNAS', 'Lunas', 'lunas', 'Selesai'] },
        ...(Object.keys(dateFilter).length > 0 && { created_at: dateFilter })
      },
      select: {
        id: true,
        sales_id: true,
        total_amount: true,
        sales_commission: true,
        created_at: true,
        customer_name: true,
      }
    });

    // Kumpulkan unique sales_id
    const salesIds = [...new Set(transactions.map(t => t.sales_id))];

    // Ambil nama sales dari tabel User
    const users = await prisma.user.findMany({
      where: { id: { in: salesIds } },
      select: { id: true, name: true }
    });

    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = u.name;
    });

    // Grouping transaksi per sales
    const commissions = salesIds.map(salesId => {
      const salesTx = transactions.filter(t => t.sales_id === salesId);
      const total_transactions = salesTx.length;
      const total_omset = salesTx.reduce((sum, t) => sum + t.total_amount, 0);
      
      const transactions_detail = salesTx.map(t => {
        const commission = t.sales_commission !== null ? t.sales_commission : (t.total_amount * COMMISSION_RATE);
        return {
          id: t.id,
          date: t.created_at,
          customer_name: t.customer_name,
          total_amount: t.total_amount,
          commission: commission,
          is_manual: t.sales_commission !== null
        };
      });

      const estimated_commission = transactions_detail.reduce((sum, t) => sum + t.commission, 0);

      return {
        sales_id: salesId,
        sales_name: userMap[salesId] || `Sales ${salesId}`,
        total_transactions,
        total_omset,
        estimated_commission,
        transactions: transactions_detail
      };
    });

    res.json(commissions);
  } catch (error) {
    next(error);
  }
};

exports.updateCommission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { commissionAmount } = req.body;

    if (!id) return res.status(400).json({ message: 'ID Transaksi wajib diisi' });

    // Allow null or number
    const finalCommission = commissionAmount !== null && commissionAmount !== '' ? Number(commissionAmount) : null;

    const updated = await prisma.transaction.update({
      where: { id: Number(id) },
      data: { sales_commission: finalCommission }
    });

    res.json({ message: 'Komisi berhasil diperbarui', transaction: updated });
  } catch (error) {
    next(error);
  }
};

// ── AGING SCHEDULE PIUTANG ───────────────────────────────────────────────────
// Acuan: termin_schedule (tanggal jatuh tempo yang disepakati), bukan created_at.
// Piutang baru disebut "menunggak" jika sudah melewati tanggal termin, bukan dari hari invoice.
exports.getReceivablesWithAging = async (req, res, next) => {
  try {
    const receivables = await prisma.transaction.findMany({
      where: {
        OR: [
          { sisa_tagihan: { gt: 0 } },
          { status_pembayaran: { in: ['Proses', 'DP / Sebagian', 'Belum Bayar', 'PROSES', 'DP'] } }
        ]
      },
      include: { items: true, payments: true },
      orderBy: { created_at: 'desc' }
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    /**
     * Parse termin_schedule — bisa berupa:
     *   - ISO date string: "2026-10-15"
     *   - JSON array dari termin bertahap: [{"date":"2026-10-15","amount":1000000}, ...]
     *   - Null / undefined
     * Returns Date | null
     */
    const parseTerminDate = (terminStr) => {
      if (!terminStr) return null;
      try {
        const parsed = JSON.parse(terminStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ambil tanggal termin terakhir yang belum lunas
          const dates = parsed.map(t => new Date(t.date)).filter(d => !isNaN(d));
          if (dates.length > 0) return dates[dates.length - 1]; // termin akhir
        }
        if (typeof parsed === 'string') return new Date(parsed);
      } catch (_) {
        // Bukan JSON, coba langsung parse sebagai string
        const d = new Date(terminStr);
        if (!isNaN(d)) return d;
      }
      return null;
    };

    /**
     * Kategorikan aging berdasarkan termin_schedule:
     *   - "current"   : belum jatuh tempo atau tidak ada termin
     *   - "1-30"      : lewat 1–30 hari
     *   - "31-60"     : lewat 31–60 hari
     *   - "bad_debt"  : lewat >60 hari
     */
    const categorize = (terminDate) => {
      if (!terminDate) return 'current'; // tidak ada termin → anggap belum jatuh tempo
      const daysOverdue = Math.floor((now - terminDate) / (1000 * 60 * 60 * 24));
      if (daysOverdue <= 0)  return 'current';
      if (daysOverdue <= 30) return '1-30';
      if (daysOverdue <= 60) return '31-60';
      return 'bad_debt';
    };

    // Aggregat per aging bucket
    const agingTotals = { current: 0, '1-30': 0, '31-60': 0, bad_debt: 0 };

    const enriched = receivables.map(r => {
      const terminDate = parseTerminDate(r.termin_schedule);
      const daysOverdue = terminDate ? Math.max(0, Math.floor((now - terminDate) / (1000 * 60 * 60 * 24))) : 0;
      const aging_category = categorize(terminDate);
      agingTotals[aging_category] += r.sisa_tagihan || 0;

      return {
        ...r,
        aging_category,
        days_overdue: daysOverdue,
        termin_date: terminDate ? terminDate.toISOString() : null,
      };
    });

    res.json({
      success: true,
      data: enriched,
      aging_summary: agingTotals,
      total_piutang: enriched.reduce((s, r) => s + (r.sisa_tagihan || 0), 0),
    });
  } catch (error) {
    next(error);
  }
};

// ── ALERT PIUTANG JATUH TEMPO (H-3) ─────────────────────────────────────────
// Notifikasi muncul jika termin_schedule <= 3 hari dari hari ini
exports.getReceivableAlerts = async (req, res, next) => {
  try {
    const { daysAhead = 3 } = req.query;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const limitDate = new Date(now);
    limitDate.setDate(limitDate.getDate() + parseInt(daysAhead));

    // Ambil semua piutang aktif
    const receivables = await prisma.transaction.findMany({
      where: {
        sisa_tagihan: { gt: 0 },
        termin_schedule: { not: null }
      },
      select: {
        id: true, customer_name: true, customer_phone: true,
        total_amount: true, sisa_tagihan: true,
        termin_schedule: true, created_at: true, branch: true
      }
    });

    const alerts = [];

    for (const r of receivables) {
      if (!r.termin_schedule) continue;

      // Parse termin schedule (sama logika dengan getReceivablesWithAging)
      let terminDate = null;
      try {
        const parsed = JSON.parse(r.termin_schedule);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Cari termin yang paling dekat dan belum lewat
          const upcoming = parsed
            .map(t => new Date(t.date))
            .filter(d => !isNaN(d) && d >= now)
            .sort((a, b) => a - b);
          terminDate = upcoming.length > 0 ? upcoming[0] : null;
        } else if (typeof parsed === 'string') {
          terminDate = new Date(parsed);
        }
      } catch (_) {
        const d = new Date(r.termin_schedule);
        if (!isNaN(d)) terminDate = d;
      }

      if (!terminDate) continue;

      const daysUntilDue = Math.floor((terminDate - now) / (1000 * 60 * 60 * 24));

      // Alert H-3: jatuh tempo dalam 0–3 hari ke depan
      if (daysUntilDue >= 0 && daysUntilDue <= parseInt(daysAhead)) {
        alerts.push({
          transaction_id: r.id,
          customer_name: r.customer_name || 'Tanpa Nama',
          customer_phone: r.customer_phone || '-',
          sisa_tagihan: r.sisa_tagihan,
          total_amount: r.total_amount,
          termin_date: terminDate.toISOString(),
          days_until_due: daysUntilDue,
          branch: r.branch || 'Gallardo',
          urgency: daysUntilDue === 0 ? 'critical' : daysUntilDue === 1 ? 'high' : 'medium',
        });
      }
    }

    // Sort: paling urgent dulu
    alerts.sort((a, b) => a.days_until_due - b.days_until_due);

    res.json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};
