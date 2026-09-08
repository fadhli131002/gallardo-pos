const prisma = require('../../config/db');

/**
 * POST /api/notifications/warn-sales
 * Admin/Superadmin sends a duplicate warning to the PIC Sales who created the transaction.
 */
const warnSalesForDuplicate = async (req, res, next) => {
  try {
    const { transactionId, salesId, salesName, reason, plateNumber, customerName } = req.body;
    const adminUser = req.user || {};

    if (!transactionId) {
      return res.status(400).json({ success: false, message: 'Transaction ID wajib disertakan' });
    }

    const numericTrxId = parseInt(transactionId, 10);
    const formattedId = `TRX-DB-${numericTrxId}`;

    // Find the transaction to ensure valid target
    const trx = await prisma.transaction.findUnique({
      where: { id: numericTrxId }
    });

    const targetSalesId = salesId ? parseInt(salesId, 10) : (trx ? trx.sales_id : null);
    const targetSalesName = salesName || (trx ? (trx.event || 'Sales Team') : 'Sales Team');

    const warningMessage = `Terdapat indikasi input ganda pada transaksi #${numericTrxId} (${customerName || trx?.customer_name || 'Pelanggan'} - Plat: ${plateNumber || trx?.plate_number || '-'}). Harap segera periksa, batalkan yang salah, atau konfirmasi ke Admin. ${reason ? `[Catatan: ${reason}]` : ''}`;

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        user_id: targetSalesId,
        target_sales: targetSalesName,
        sender_id: adminUser.user_id || adminUser.id || null,
        sender_name: adminUser.name || 'Admin',
        transaction_id: numericTrxId,
        type: 'DUPLICATE_WARNING',
        title: `Peringatan Input Ganda (Transaksi #${numericTrxId})`,
        message: warningMessage,
        is_read: false
      }
    });

    res.json({
      success: true,
      message: `Peringatan duplikat berhasil dikirim ke Sales ${targetSalesName}`,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/my-warnings
 * Returns active unread / recent warnings for logged-in user (especially Sales)
 */
const getMyWarnings = async (req, res, next) => {
  try {
    const user = req.user || {};
    const userId = parseInt(user.user_id || user.id, 10);
    const userName = (user.name || '').trim();

    // Query notifications where user_id matches OR target_sales matches name
    const whereConditions = [];
    if (!isNaN(userId)) {
      whereConditions.push({ user_id: userId });
    }
    if (userName) {
      const cleanName = userName.replace(/\s*(sales|team|internal|admin)\s*/gi, '').trim();
      whereConditions.push({ target_sales: { contains: cleanName } });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        OR: whereConditions.length > 0 ? whereConditions : undefined,
        type: 'DUPLICATE_WARNING'
      },
      orderBy: { created_at: 'desc' },
      take: 20
    });

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/all-warnings
 * Admin view to check which transactions have been warned
 */
const getAllWarnings = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        type: 'DUPLICATE_WARNING'
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notif = await prisma.notification.update({
      where: { id: parseInt(id, 10) },
      data: { is_read: true }
    });

    res.json({
      success: true,
      data: notif
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  warnSalesForDuplicate,
  getMyWarnings,
  getAllWarnings,
  markAsRead
};
