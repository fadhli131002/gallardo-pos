const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Laporan Omset Bersih (Net Revenue)
exports.getNetRevenue = async (req, res, next) => {
  try {
    const { month } = req.query; // format YYYY-MM
    let dateFilter = {};
    if (month) {
      const startDate = new Date(`${month}-01T00:00:00.000Z`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
      dateFilter = { created_at: { gte: startDate, lte: endDate } };
    }

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
      const startDate = new Date(`${month}-01T00:00:00.000Z`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
      dateFilter = { created_at: { gte: startDate, lte: endDate } };
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
      startDate = new Date(`${month}-01T00:00:00.000Z`);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
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
      const startDate = new Date(`${month}-01T00:00:00.000Z`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
      dateFilter = { created_at: { gte: startDate, lte: endDate } };
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
      const startDate = new Date(`${month}-01T00:00:00.000Z`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
      dateFilter = { created_at: { gte: startDate, lte: endDate } };
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
