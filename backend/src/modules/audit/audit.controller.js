const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Simpan audit log — hanya simpan field yang benar-benar berubah,
 * bukan seluruh objek transaksi, agar tidak membebani SQLite.
 *
 * @param {Object} params
 * @param {number} params.userId
 * @param {string} params.userName
 * @param {string} params.action    — CANCEL_INVOICE | MARK_PAID | EDIT_PRICE | STOCK_ADJUST | EDIT_DISCOUNT
 * @param {string} params.targetType — Transaction | InventoryLog
 * @param {number} params.targetId
 * @param {string} [params.reason]
 * @param {Object} [params.oldValue] — objek dengan key-value field yang berubah (sebelum)
 * @param {Object} [params.newValue] — objek dengan key-value field yang berubah (sesudah)
 */
async function createAuditLog({ userId, userName, action, targetType, targetId, reason, oldValue, newValue }) {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId || 0,
        user_name: userName || 'System',
        action,
        target_type: targetType,
        target_id: targetId,
        reason: reason || null,
        old_value: oldValue ? JSON.stringify(oldValue) : null,
        new_value: newValue ? JSON.stringify(newValue) : null,
      }
    });
  } catch (err) {
    // Audit log tidak boleh menggagalkan operasi utama
    console.error('[AuditLog] Gagal menyimpan log:', err.message);
  }
}

// GET /api/audit/logs — hanya Admin/Finance/Owner
const getAuditLogs = async (req, res, next) => {
  try {
    const { target_type, action, target_id, startDate, endDate, page = 1, limit = 50 } = req.query;

    const where = {};
    if (target_type) where.target_type = target_type;
    if (action) where.action = action;
    if (target_id) where.target_id = parseInt(target_id);
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.created_at.lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    const parsed = logs.map(log => ({
      ...log,
      old_value: log.old_value ? JSON.parse(log.old_value) : null,
      new_value: log.new_value ? JSON.parse(log.new_value) : null,
    }));

    res.json({
      success: true,
      data: parsed,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createAuditLog, getAuditLogs };
