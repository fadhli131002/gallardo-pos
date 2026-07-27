const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Dashboard Summary
const getDashboardSummary = async (req, res, next) => {
  console.log("=> GET /api/owner/dashboard-summary reached! Query:", req.query);
  try {
    const { year, month } = req.query;
    
    // Build date filter for transactions (status = LUNAS / Selesai)
    let startDate, endDate;
    const y = parseInt(year) || new Date().getFullYear();
    
    if (month) {
      const m = parseInt(month);
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 1); // first day of next month
    } else {
      startDate = new Date(y, 0, 1);
      endDate = new Date(y + 1, 0, 1);
    }

    // A. Laba Rugi (Omset)
    const transactions = await prisma.transaction.findMany({
      where: {
        created_at: {
          gte: startDate,
          lt: endDate
        }
      },
      include: {
        inventory_logs: {
          where: { jenis: 'DEDUCT' },
          include: { inventory: true }
        },
        items: true
      }
    });

    let totalOmset = 0;
    let totalHPP = 0;

    transactions.forEach(trx => {
      totalOmset += trx.total_amount;
      
      // Hitung HPP dari inventory logs
      trx.inventory_logs.forEach(log => {
        if (log.inventory) {
          const konversi = log.inventory.konversi || 1;
          const hargaModal = log.inventory.harga_modal || 0;
          // jumlah di inventory_log adalah dalam satuan pecahan (meter dll), jadi dibagi konversi untuk dapat satuan utama (Roll)
          const hpp = (log.jumlah / konversi) * hargaModal;
          totalHPP += hpp;
        }
      });
    });

    // B. Total Beban Operasional (Expenses)
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate
        }
      }
    });
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const complaints = await prisma.complaint.findMany({
      where: {
        created_at: {
          gte: startDate,
          lt: endDate
        }
      },
      include: {
        transaction: {
          include: {
            inventory_logs: {
              where: { jenis: 'DEDUCT', keterangan: { contains: 'Komplain' } },
              include: { inventory: true }
            }
          }
        }
      }
    });

    let totalKerugianKomplain = 0;
    // Jika tidak ada inventory_log khusus komplain, kita bisa asumsikan ada field lain. 
    // Berdasarkan PRD, kerugian diambil dari log.
    complaints.forEach(c => {
      if (c.transaction && c.transaction.inventory_logs) {
        c.transaction.inventory_logs.forEach(log => {
          if (log.inventory) {
            const konversi = log.inventory.konversi || 1;
            const hpp = (log.jumlah / konversi) * (log.inventory.harga_modal || 0);
            totalKerugianKomplain += hpp;
          }
        });
      }
    });

    // Laba Bersih
    const labaBersih = totalOmset - totalHPP - totalExpense - totalKerugianKomplain;

    console.log("=== DEBUG DASHBOARD OWNER ===");
    console.log("Transactions Count:", transactions.length);
    console.log("Expenses Count:", expenses.length);
    console.log("Complaints Count:", complaints.length);
    console.log("Total Omset:", totalOmset);
    console.log("Total HPP:", totalHPP);
    console.log("Total Expense:", totalExpense);
    console.log("Total Kerugian Komplain:", totalKerugianKomplain);
    console.log("Laba Bersih:", labaBersih);
    console.log("=============================");

    // D. Cash Flow (Arus Kas Bersih)
    const cashFlows = await prisma.cashFlowLog.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate
        }
      }
    });
    
    let cashIn = 0;
    let cashOut = 0;
    cashFlows.forEach(cf => {
      if (cf.type === 'IN') cashIn += cf.amount;
      if (cf.type === 'OUT') cashOut += cf.amount;
    });
    const netCashFlow = cashIn - cashOut;

    // E. Operational Metrics
    let topSalesMap = {};
    let topCustomersMap = {};
    let topRetailMap = {};
    let orderStats = { lunas: 0, pending: 0, pendingIds: [] };

    transactions.forEach(trx => {
      // Sales
      const salesName = trx.event || 'Unknown Sales';
      topSalesMap[salesName] = (topSalesMap[salesName] || 0) + trx.total_amount;

      // Customers & Retail Separation
      const custName = trx.customer_name || 'Retail Umum';
      
      const isRetail = trx.type === 'RETAIL' ||
        (trx.customer_name && trx.customer_name.toLowerCase().includes('pelanggan umum')) ||
        (trx.items && trx.items.some(i => (i.product_name || '').toLowerCase().includes('roll')));

      if (isRetail) {
        // Retail / Grosir
        topRetailMap[custName] = (topRetailMap[custName] || 0) + trx.total_amount;
      } else {
        // Workshop Customer
        topCustomersMap[custName] = (topCustomersMap[custName] || 0) + trx.total_amount;
      }

      // Order Stats
      // Validating whether paid fully or not
      const lunasStatus = ['LUNAS', 'Lunas', 'lunas', 'Paid'];
      if (lunasStatus.includes(trx.status_pembayaran) || trx.sisa_tagihan <= 0) {
        orderStats.lunas += 1;
      } else {
        orderStats.pending += 1;
        orderStats.pendingIds.push(trx.id);
      }
    });

    console.log('Pending Transaction IDs:', orderStats.pendingIds);

    const topSales = Object.keys(topSalesMap)
      .map(name => ({ name, omset: topSalesMap[name] }))
      .sort((a, b) => b.omset - a.omset)
      .slice(0, 5);

    const topCustomers = Object.keys(topCustomersMap)
      .map(name => ({ name, omset: topCustomersMap[name] }))
      .sort((a, b) => b.omset - a.omset)
      .slice(0, 5);

    const topRetail = Object.keys(topRetailMap)
      .map(name => ({ name, omset: topRetailMap[name] }))
      .sort((a, b) => b.omset - a.omset)
      .slice(0, 5);

    let complaintStats = { total: complaints.length, resolved: 0, pending: 0 };
    complaints.forEach(c => {
      if (['Selesai', 'Resolved'].includes(c.status)) {
        complaintStats.resolved += 1;
      } else {
        complaintStats.pending += 1;
      }
    });

    res.json({
      success: true,
      data: {
        totalOmset,
        totalHPP,
        totalExpense,
        labaBersih,
        totalKerugianKomplain,
        netCashFlow,
        cashIn,
        cashOut,
        topSales,
        topCustomers,
        topRetail,
        orderStats,
        complaintStats
      }
    });

  } catch (error) {
    next(error);
  }
};

// 2. Profit Loss Chart Data
const getProfitLossChart = async (req, res, next) => {
  try {
    const { year } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    
    const startDate = new Date(y, 0, 1);
    const endDate = new Date(y + 1, 0, 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        created_at: {
          gte: startDate,
          lt: endDate
        }
      },
      include: {
        inventory_logs: {
          where: { jenis: 'DEDUCT' },
          include: { inventory: true }
        }
      }
    });

    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    // Kelompokkan per bulan (0 - 11)
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      name: new Date(y, i, 1).toLocaleString('id-ID', { month: 'short' }),
      omset: 0,
      hpp: 0,
      expense: 0,
      labaBersih: 0
    }));

    transactions.forEach(trx => {
      const m = new Date(trx.created_at).getMonth();
      monthlyData[m].omset += trx.total_amount;
      
      trx.inventory_logs.forEach(log => {
        if (log.inventory) {
          const konversi = log.inventory.konversi || 1;
          const hpp = (log.jumlah / konversi) * (log.inventory.harga_modal || 0);
          monthlyData[m].hpp += hpp;
        }
      });
    });

    expenses.forEach(exp => {
      const m = new Date(exp.date).getMonth();
      monthlyData[m].expense += exp.amount;
    });

    const complaints = await prisma.complaint.findMany({
      where: {
        created_at: {
          gte: startDate,
          lt: endDate
        },
        status: { in: ['Selesai', 'Proses', 'Resolved'] }
      },
      include: {
        transaction: {
          include: {
            inventory_logs: {
              where: { jenis: 'DEDUCT', keterangan: { contains: 'Komplain' } },
              include: { inventory: true }
            }
          }
        }
      }
    });

    complaints.forEach(c => {
      const m = new Date(c.created_at).getMonth();
      if (c.transaction && c.transaction.inventory_logs) {
        c.transaction.inventory_logs.forEach(log => {
          if (log.inventory) {
            const konversi = log.inventory.konversi || 1;
            const hpp = (log.jumlah / konversi) * (log.inventory.harga_modal || 0);
            monthlyData[m].kerugianKomplain = (monthlyData[m].kerugianKomplain || 0) + hpp;
          }
        });
      }
    });

    monthlyData.forEach(data => {
      data.labaBersih = data.omset - data.hpp - data.expense - (data.kerugianKomplain || 0);
    });

    console.log("=== DEBUG PROFIT LOSS CHART ===");
    console.log("Transactions Count for Chart:", transactions.length);
    console.log("Chart Data Sample:", monthlyData.filter(d => d.omset > 0 || d.expense > 0));
    console.log("===============================");

    res.json({ success: true, data: monthlyData });

  } catch (error) {
    next(error);
  }
};

// 3. Expenses CRUD
const getExpenses = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    let where = {};
    
    if (year) {
      const y = parseInt(year);
      if (month) {
        const m = parseInt(month);
        where.date = {
          gte: new Date(y, m - 1, 1),
          lt: new Date(y, m, 1)
        };
      } else {
        where.date = {
          gte: new Date(y, 0, 1),
          lt: new Date(y + 1, 0, 1)
        };
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data: expenses });
  } catch (error) {
    next(error);
  }
};

const addExpense = async (req, res, next) => {
  try {
    const { title, category, amount, date, proofUrl } = req.body;
    const expense = await prisma.expense.create({
      data: {
        title,
        category,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        proofUrl
      }
    });
    
    // Otomatis catat ke Cash Flow
    await prisma.cashFlowLog.create({
      data: {
        type: 'OUT',
        amount: Number(amount),
        description: `Beban Operasional: ${title}`,
        referenceId: `EXP-${expense.id}`,
        date: expense.date
      }
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// 4. Purchase Orders CRUD
const getPurchaseOrders = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    let where = {};
    
    if (year) {
      const y = parseInt(year);
      if (month) {
        const m = parseInt(month);
        where.date = {
          gte: new Date(y, m - 1, 1),
          lt: new Date(y, m, 1)
        };
      } else {
        where.date = {
          gte: new Date(y, 0, 1),
          lt: new Date(y + 1, 0, 1)
        };
      }
    }

    const pos = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data: pos });
  } catch (error) {
    next(error);
  }
};

const addPurchaseOrder = async (req, res, next) => {
  try {
    const { supplier, totalAmount, status, date } = req.body;
    const po = await prisma.purchaseOrder.create({
      data: {
        supplier,
        totalAmount: Number(totalAmount),
        status: status || 'Pending',
        date: date ? new Date(date) : new Date()
      }
    });

    // Otomatis catat ke Cash Flow jika status Received / Paid
    if (po.status === 'Received' || po.status === 'Paid') {
      await prisma.cashFlowLog.create({
        data: {
          type: 'OUT',
          amount: Number(totalAmount),
          description: `Pembelian Stok dari Supplier: ${supplier}`,
          referenceId: `PO-${po.id}`,
          date: po.date
        }
      });
    }

    res.status(201).json({ success: true, data: po });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getProfitLossChart,
  getExpenses,
  addExpense,
  getPurchaseOrders,
  addPurchaseOrder
};
