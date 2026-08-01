const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// DASHBOARD KEUANGAN
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to today if no date provided
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let dateFilter = { gte: today };
    let createdFilter = { gte: today };

    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
      createdFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else if (startDate) {
      dateFilter = { gte: new Date(startDate) };
      createdFilter = { gte: new Date(startDate) };
    }

    // 1. Total Kas Masuk
    const cashFlowInToday = await prisma.cashFlowLog.aggregate({
      _sum: { amount: true },
      where: {
        type: 'IN',
        date: dateFilter
      }
    });
    const totalKasMasuk = cashFlowInToday._sum.amount || 0;

    // 2. Total Piutang (No date filter applied - all unpaid)
    const receivables = await prisma.transaction.aggregate({
      _sum: { sisa_tagihan: true },
      where: {
        sisa_tagihan: { gt: 0 }
      }
    });
    const totalPiutang = receivables._sum.sisa_tagihan || 0;

    // 3. Laba/Rugi Standar
    const omset = await prisma.transaction.aggregate({
      _sum: { total_amount: true },
      where: {
        created_at: createdFilter
      }
    });
    const totalOmset = omset._sum.total_amount || 0;

    const inventoryLogs = await prisma.inventoryLog.findMany({
      where: { 
        jenis: 'DEDUCT', 
        transaction_id: { not: null },
        created_at: createdFilter
      },
      include: { inventory: true }
    });

    let totalHpp = 0;
    for (const log of inventoryLogs) {
      if (log.inventory && log.inventory.harga_modal) {
        const konversi = log.inventory.konversi || 1;
        totalHpp += (log.jumlah * (log.inventory.harga_modal / konversi));
      }
    }

    const labaRugi = totalOmset - totalHpp;

    res.json({
      totalKasMasuk,
      totalPiutang,
      labaRugi,
      totalOmset,
      totalHpp
    });
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
