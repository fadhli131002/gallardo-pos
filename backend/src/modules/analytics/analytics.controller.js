const prisma = require('../../config/db');

const getCustomerRanking = async (req, res, next) => {
  try {
    const { year, type } = req.query;

    let whereClause = {
      customer_name: {
        notIn: ['Pelanggan Umum (Tanpa Nama)', ''],
        not: null
      }
    };

    if (year) {
      const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
      whereClause.created_at = {
        gte: startOfYear,
        lte: endOfYear
      };
    }

    if (type) {
      // We will filter in-memory to match frontend classification logic precisely
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        items: true
      }
    });

    const customerMap = {};

    transactions.forEach(trx => {
      const isRetail = trx.type === 'RETAIL' || 
        (trx.customer_name && trx.customer_name.toLowerCase().includes('pelanggan umum')) ||
        (trx.items && trx.items.some(i => (i.product_name || '').toLowerCase().includes('roll')));

      if (type === 'Jasa (Workshop)' && isRetail) return;
      if (type === 'Retail (Grosir)' && !isRetail) return;

      const name = trx.customer_name || 'Pelanggan Umum (Tanpa Nama)';
      const phone = trx.customer_phone || '-';

      if (!customerMap[name]) {
        customerMap[name] = {
          customerName: name,
          customerPhone: phone,
          totalOmzet: 0,
          totalRoll: 0,
          transactionCount: 0
        };
      }

      customerMap[name].totalOmzet += trx.total_amount;
      customerMap[name].transactionCount += 1;
      if (customerMap[name].customerPhone === '-' && phone !== '-') {
         customerMap[name].customerPhone = phone;
      }

      trx.items.forEach(item => {
        customerMap[name].totalRoll += item.quantity;
      });
    });

    const rankingData = Object.values(customerMap).sort((a, b) => b.totalOmzet - a.totalOmzet);

    const rankedData = rankingData.map((data, index) => ({
      rank: index + 1,
      ...data
    }));

    res.json({
      success: true,
      data: rankedData
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const { role, user_id, id } = req.user || {};
    const userId = user_id || id;

    let whereClause = {};
    if (role === 'sales' || role === 'sales_team') {
      whereClause.sales_id = parseInt(userId);
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { created_at: 'desc' }
    });

    // 1. Total Customers (Unique non-empty names)
    const customerSet = new Set();
    transactions.forEach(t => {
      const name = (t.customer_name || '').trim();
      const phone = (t.customer_phone || '').trim();
      if (name && name !== 'Pelanggan Umum (Tanpa Nama)') {
        customerSet.add(name);
      } else if (phone && phone !== '-') {
        customerSet.add(phone);
      }
    });
    const totalCustomers = customerSet.size;

    // 2. Total Orders
    const totalOrders = transactions.length;

    // 3. Lunas & Proses
    const lunasOrders = transactions.filter(t => 
      t.status_pembayaran?.toUpperCase() === 'LUNAS' || t.sisa_tagihan <= 0
    ).length;

    const prosesOrders = totalOrders - lunasOrders;

    // 4. Weekly Sales Dynamics (Minggu 1 - 4)
    const weeklyData = [1, 2, 3, 4].map(w => ({
      week: `Minggu ${w}`,
      revenue: 0
    }));

    transactions.forEach(t => {
      const d = new Date(t.created_at);
      const dateNum = d.getDate();
      let weekIndex = Math.floor((dateNum - 1) / 7);
      if (weekIndex > 3) weekIndex = 3;
      weeklyData[weekIndex].revenue += (t.total_amount || 0);
    });

    // 5. Top Products (Produk Terlaris)
    const productSalesMap = {};
    transactions.forEach(t => {
      t.items.forEach(item => {
        const name = item.product_name || 'Lainnya';
        productSalesMap[name] = (productSalesMap[name] || 0) + item.quantity;
      });
    });

    let topProducts = Object.entries(productSalesMap)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    if (topProducts.length === 0) {
      topProducts = [
        { name: 'Kaca Film', sales: 0 },
        { name: 'Coating', sales: 0 },
        { name: 'PPF', sales: 0 }
      ];
    }

    // 6. Recent Orders (5 data)
    const recentOrders = transactions.slice(0, 5).map(t => ({
      id: `RTL-DB-${t.id}`,
      customerName: t.customer_name || 'Pelanggan Umum (Tanpa Nama)',
      totalPrice: t.total_amount,
      date: t.created_at,
      paymentStatus: t.status_pembayaran || (t.sisa_tagihan <= 0 ? 'LUNAS' : 'PROSES'),
      serviceType: t.items.map(i => i.product_name).join(', ') || 'Retail'
    }));

    // 7. Total Omzet
    const totalOmzet = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalOrders,
        lunasOrders,
        prosesOrders,
        totalOmzet,
        weeklyData,
        topProducts,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * getSalesDashboardStats — endpoint khusus Sales Dashboard
 * Filter berdasarkan:
 *   1. sales_id (ID user yang sedang login) — transaksi yg dibuat lewat POS sales
 *   2. ATAU pencocokan nama event/spgName dari transaksi workshop
 *      (case-insensitive, strip suffix " Sales" agar "Femy Sales" → cocok dengan event "Femy" / "Femmy")
 */
const getSalesDashboardStats = async (req, res, next) => {
  try {
    const { user_id, name: loggedInName, role } = req.user || {};
    const userId = parseInt(user_id);

    // Normalise: "Femy Sales" → "femy", "Rosyid" → "rosyid"
    const normalise = (str) =>
      (str || '')
        .toLowerCase()
        .replace(/\b(sales|team|internal|admin)\b/gi, '')
        .replace(/(.)\1+/g, '$1')   // dedup chars: "femmy" → "femy"
        .trim();

    const searchName = normalise(loggedInName);

    // Fetch ALL transactions so we can do case-insensitive partial match in JS
    // (SQLite doesn't support mode:'insensitive' in Prisma)
    const allTransactions = await prisma.transaction.findMany({
      include: { items: true, payments: true },
      orderBy: { created_at: 'desc' }
    });

    // Filter: milik sales ini berdasarkan sales_id pembuat transaksi
    const transactions = allTransactions.filter(t => t.sales_id === userId);

    // 1. Total Customers (unique non-empty names/phones)
    const customerSet = new Set();
    transactions.forEach(t => {
      const name = (t.customer_name || '').trim();
      const phone = (t.customer_phone || '').trim();
      if (name && name !== 'Pelanggan Umum (Tanpa Nama)') {
        customerSet.add(name);
      } else if (phone && phone !== '-') {
        customerSet.add(phone);
      }
    });
    const totalCustomer = customerSet.size;

    // 2. Total Orders
    const totalOrder = transactions.length;

    // 3. Lunas & Proses
    const transaksiLunas = transactions.filter(t =>
      t.status_pembayaran?.toUpperCase() === 'LUNAS' || t.sisa_tagihan <= 0
    ).length;
    const transaksiProses = totalOrder - transaksiLunas;

    // 4. Total Omzet
    const totalOmzet = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);

    // 5. Weekly Dynamics (Minggu 1–4, based on day-of-month)
    const weeklyData = [1, 2, 3, 4].map(w => ({ week: `Minggu ${w}`, revenue: 0 }));
    transactions.forEach(t => {
      const dateNum = new Date(t.created_at).getDate();
      let wIdx = Math.floor((dateNum - 1) / 7);
      if (wIdx > 3) wIdx = 3;
      weeklyData[wIdx].revenue += (t.total_amount || 0);
    });

    // 6. Top Products (Produk Terlaris)
    const productMap = {};
    transactions.forEach(t => {
      (t.items || []).forEach(item => {
        const pName = item.product_name || 'Lainnya';
        productMap[pName] = (productMap[pName] || 0) + (item.quantity || 1);
      });
    });
    let topProducts = Object.entries(productMap)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
    if (topProducts.length === 0) {
      topProducts = [
        { name: 'Kaca Film', sales: 0 },
        { name: 'Coating', sales: 0 },
        { name: 'PPF', sales: 0 }
      ];
    }

    // 7. Recent Orders (5 data terbaru)
    const recentOrders = transactions.slice(0, 5).map(t => ({
      id: `WRK-DB-${t.id}`,
      customerName: t.customer_name || 'Pelanggan Umum (Tanpa Nama)',
      totalPrice: t.total_amount,
      date: t.created_at,
      paymentStatus: t.status_pembayaran || (t.sisa_tagihan <= 0 ? 'LUNAS' : 'PROSES'),
      serviceType: (t.items || []).map(i => i.product_name).join(', ') || 'Workshop'
    }));

    return res.json({
      success: true,
      data: {
        totalCustomers: totalCustomer,
        totalOrders: totalOrder,
        lunasOrders: transaksiLunas,
        prosesOrders: transaksiProses,
        totalOmzet,
        weeklyData,
        topProducts,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCustomerRanking, getDashboardStats, getSalesDashboardStats };
