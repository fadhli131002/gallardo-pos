const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getMonthDateRange(month) {
  if (!month) return null;
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr);
  const m = parseInt(monthStr);
  const startDate = new Date(year, m - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(year, m, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

// 1. Laporan Omset Bersih (Net Revenue)
exports.getNetRevenue = async (req, res, next) => {
  try {
    const { month, force } = req.query; // format YYYY-MM
    let dateFilter = {};
    let expenseDateFilter = {};
    if (month) {
      const range = getMonthDateRange(month);
      if (range) {
        dateFilter = { created_at: { gte: range.startDate, lte: range.endDate } };
        expenseDateFilter = { date: { gte: range.startDate, lte: range.endDate } };
      }
    }

    // ── Mandatory Beban Validation ────────────────────────────────────────
    // Tolak request jika total beban bulan ini = 0 (kecuali force=true dikirim)
    if (force !== 'true') {
      const expenseCheck = await prisma.expense.aggregate({
        _sum: { amount: true },
        where: Object.keys(expenseDateFilter).length > 0 ? expenseDateFilter : undefined
      });
      const totalExpenseCheck = expenseCheck._sum.amount || 0;

      if (totalExpenseCheck === 0) {
        return res.status(422).json({
          success: false,
          errorCode: 'BEBAN_KOSONG',
          message: `Beban Operasional bulan ${month || 'ini'} belum diisi (Rp 0). Laporan tidak dapat digenerate karena akan menghasilkan Laba Bersih yang tidak akurat. Isi data Beban terlebih dahulu di menu Keuangan → Beban Operasional.`,
        });
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    const transactions = await prisma.transaction.findMany({
      where: {
        status_pembayaran: { not: 'Batal' }, // Ambil semua kecuali Batal
        ...dateFilter
      },
      select: {
        total_amount: true,
        sisa_tagihan: true,
        sales_commission: true
      }
    });

    let grossRevenue = 0;
    let totalUnpaid = 0;
    let totalCommission = 0;

    transactions.forEach(t => {
      grossRevenue += t.total_amount || 0;
      totalUnpaid += t.sisa_tagihan || 0;
      totalCommission += t.sales_commission || 0;
    });

    const totalPaid = grossRevenue - totalUnpaid;
    const netRevenue = totalPaid - totalCommission;

    res.json({
      month: month || 'All Time',
      grossRevenue,
      totalPaid,
      totalUnpaid,
      totalCommission,
      netRevenue
    });
  } catch (error) {
    next(error);
  }
};

// 2. Laporan Penjualan Per Brand/Produk
exports.getSalesByProduct = async (req, res, next) => {
  try {
    const { month, status } = req.query;
    let dateFilter = {};
    if (month) {
      const range = getMonthDateRange(month);
      if (range) dateFilter = { created_at: { gte: range.startDate, lte: range.endDate } };
    }

    const whereClause = {
      status_pembayaran: { not: 'Batal' },
      ...dateFilter
    };

    if (status && status !== 'Semua') {
      whereClause.status_pembayaran = status;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: { items: true }
    });

    const grouped = {};
    transactions.forEach(tx => {
      const totalGross = tx.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
      const commission = tx.sales_commission !== null ? tx.sales_commission : ((tx.total_amount || 0) * 0.05);
      const netAmount = (tx.total_amount || 0) - commission;

      tx.items.forEach(item => {
        const name = item.product_name || 'Lainnya';
        if (!grouped[name]) {
          grouped[name] = { product_name: name, qty: 0, total_revenue_gross: 0, total_revenue_net: 0 };
        }
        grouped[name].qty += item.quantity || 0;

        const itemBaseGross = (item.price || 0) * (item.quantity || 0);
        let itemGrossAlloc = 0;
        let itemNetAlloc = 0;

        if (totalGross > 0) {
          itemGrossAlloc = (itemBaseGross / totalGross) * (tx.total_amount || 0);
          itemNetAlloc = (itemBaseGross / totalGross) * netAmount;
        } else {
          itemGrossAlloc = tx.items.length > 0 ? (tx.total_amount || 0) / tx.items.length : 0;
          itemNetAlloc = tx.items.length > 0 ? netAmount / tx.items.length : 0;
        }

        grouped[name].total_revenue_gross += itemGrossAlloc;
        grouped[name].total_revenue_net += itemNetAlloc;
        // keep total_revenue for backward compatibility if needed
        grouped[name].total_revenue = grouped[name].total_revenue_gross; 
      });
    });

    const result = Object.values(grouped).sort((a, b) => b.total_revenue_gross - a.total_revenue_gross);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// 3. Laporan Mutasi Stok
exports.getStockMutation = async (req, res, next) => {
  try {
    const { month } = req.query;
    let startDate, endDate;
    
    if (month) {
      const range = getMonthDateRange(month);
      startDate = range.startDate;
      endDate = range.endDate;
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Ambil semua inventory
    const inventories = await prisma.inventory.findMany();
    
    // Ambil logs untuk bulan tersebut
    const logs = await prisma.inventoryLog.findMany({
      where: {
        created_at: { gte: startDate, lte: endDate }
      },
      orderBy: { created_at: 'asc' }
    });

    const mutationMap = {};
    inventories.forEach(inv => {
      mutationMap[inv.id] = {
        id: inv.id,
        kategori: inv.kategori,
        brand: inv.brand,
        varian: inv.varian,
        satuan: inv.satuan,
        konversi: inv.konversi || 1,
        // Stok saat ini
        currentStokUtama: inv.stok_utama,
        currentStokPecahan: inv.stok_pecahan,
        // Total Mutasi Bulan Ini
        masuk: 0,
        keluar: 0,
        // Untuk rekonstruksi
        logs: []
      };
    });

    logs.forEach(log => {
      if (mutationMap[log.inventory_id]) {
        mutationMap[log.inventory_id].logs.push(log);
        if (log.jenis === 'RESTOCK' || (log.jenis === 'ADJUST' && log.jumlah > 0)) {
          mutationMap[log.inventory_id].masuk += Math.abs(log.jumlah);
        } else if (log.jenis === 'DEDUCT' || (log.jenis === 'ADJUST' && log.jumlah < 0)) {
          mutationMap[log.inventory_id].keluar += Math.abs(log.jumlah);
        }
      }
    });

    // Karena mencari mundur dari current stok sangat rumit jika transaksi ada di masa lalu tapi ada transaksi baru,
    // paling aman: Awal = item.logs[0].stok_sebelum, atau current jika tidak ada log
    const result = Object.values(mutationMap).map(item => {
      let awal = item.currentStokUtama + (item.currentStokPecahan / item.konversi);
      let akhir = awal;
      
      if (item.logs.length > 0) {
        awal = item.logs[0].stok_sebelum;
        akhir = item.logs[item.logs.length - 1].stok_sesudah;
      }
      
      // Hitung pecahan jika diperlukan (Meter)
      const hitungUtamaPecahan = (totalBase) => {
        const utama = Math.floor(totalBase);
        let pecahan = (totalBase - utama) * item.konversi;
        // Pembulatan 2 desimal
        pecahan = Math.round(pecahan * 100) / 100;
        return { utama, pecahan };
      };

      const awalStock = hitungUtamaPecahan(awal);
      const akhirStock = hitungUtamaPecahan(akhir);
      const masukStock = hitungUtamaPecahan(item.masuk);
      const keluarStock = hitungUtamaPecahan(item.keluar);

      return {
        id: item.id,
        nama: `${item.brand} ${item.varian}`,
        kategori: item.kategori,
        satuan: item.satuan,
        awal: awalStock,
        masuk: masukStock,
        keluar: keluarStock,
        akhir: akhirStock
      };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// 4. Laporan Daftar Transaksi & Pelanggan
exports.getInvoiceList = async (req, res, next) => {
  try {
    const { month, status } = req.query;
    let dateFilter = {};
    if (month) {
      const range = getMonthDateRange(month);
      if (range) dateFilter = { created_at: { gte: range.startDate, lte: range.endDate } };
    }

    const whereClause = { ...dateFilter };
    if (status && status !== 'Semua') {
      whereClause.status_pembayaran = status;
    }

    const invoices = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        items: true,
        payments: true
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(invoices);
  } catch (error) {
    next(error);
  }
};

// 5. Laporan Data Komplain
exports.getComplaints = async (req, res, next) => {
  try {
    const { month } = req.query;
    let dateFilter = {};
    if (month) {
      const range = getMonthDateRange(month);
      if (range) dateFilter = { created_at: { gte: range.startDate, lte: range.endDate } };
    }

    const complaints = await prisma.complaint.findMany({
      where: dateFilter,
      include: {
        transaction: {
          select: {
            customer_name: true,
            car_brand: true,
            car_model: true,
            plate_number: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(complaints);
  } catch (error) {
    next(error);
  }
};

// 6. Cek status beban operasional (untuk validasi frontend sebelum generate laporan)
exports.validateBeban = async (req, res, next) => {
  try {
    const { month } = req.query; // format YYYY-MM
    let expenseDateFilter = {};
    if (month) {
      const range = getMonthDateRange(month);
      if (range) expenseDateFilter = { date: { gte: range.startDate, lte: range.endDate } };
    }

    const expenseAgg = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: Object.keys(expenseDateFilter).length > 0 ? expenseDateFilter : undefined
    });
    const totalBeban = expenseAgg._sum.amount || 0;

    res.json({
      success: true,
      month: month || 'All Time',
      totalBeban,
      isValid: totalBeban > 0,
      message: totalBeban > 0
        ? `Beban operasional bulan ${month} sudah diisi (Rp ${totalBeban.toLocaleString('id-ID')})`
        : `Beban Operasional bulan ${month || 'ini'} belum diisi. Isi dulu sebelum generate laporan.`,
    });
  } catch (error) {
    next(error);
  }
};
