const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 1. POST /api/deletion-requests
 * Kasir / Sales / Admin mengajukan permohonan hapus data customer/transaksi
 */
const createDeletionRequest = async (req, res, next) => {
  try {
    const {
      transactionId,
      customerId,
      customerName,
      customerPhone,
      plateNumber,
      carBrand,
      totalAmount,
      reason
    } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: 'Nama pelanggan wajib diisi.' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Alasan pengajuan hapus data wajib diisi.' });
    }

    const cashierId = req.user?.id || req.user?.user_id || null;
    const cashierName = req.user?.name || req.body.cashierName || 'Kasir';

    let parsedTrxId = transactionId ? parseInt(transactionId, 10) : null;

    // Resolusi transaction_id riil dari database jika parsedTrxId tidak valid atau salah tangkap
    if (parsedTrxId) {
      const directTrx = await prisma.transaction.findUnique({ where: { id: parsedTrxId } });
      if (!directTrx) {
        // Coba ekstrak dari customerId jika formatnya WRK/26-09-003-0312 atau RTL-DB-12
        parsedTrxId = null;
      }
    }

    if (!parsedTrxId && customerId) {
      const parts = String(customerId).split(/[-/]/);
      const lastPart = parts[parts.length - 1];
      const match = lastPart.match(/\d+/);
      if (match) {
        const potentialId = parseInt(match[0], 10);
        const candidate = await prisma.transaction.findUnique({ where: { id: potentialId } });
        if (candidate) {
          parsedTrxId = candidate.id;
        }
      }
    }

    // Jika masih null, coba cari berdasarkan nama customer & car/phone
    if (!parsedTrxId && customerName) {
      const found = await prisma.transaction.findFirst({
        where: {
          customer_name: { contains: customerName.trim() },
          ...(plateNumber && plateNumber !== '-' ? { plate_number: plateNumber.trim() } : {})
        },
        orderBy: { id: 'desc' }
      });
      if (found) {
        parsedTrxId = found.id;
      }
    }

    // Cek apakah sudah ada request PENDING untuk transaksi/customer yang sama
    if (parsedTrxId) {
      const existingPending = await prisma.deletionRequest.findFirst({
        where: {
          transaction_id: parsedTrxId,
          status: 'PENDING'
        }
      });

      if (existingPending) {
        return res.status(400).json({
          success: false,
          message: 'Pengajuan hapus untuk transaksi ini sudah ada dan masih berstatus MENUNGGU PERSETUJUAN (PENDING).'
        });
      }
    }

    const newRequest = await prisma.deletionRequest.create({
      data: {
        transaction_id: parsedTrxId,
        customer_id: customerId ? String(customerId) : (parsedTrxId ? `#${parsedTrxId}` : null),
        customer_name: customerName.trim(),
        customer_phone: customerPhone ? String(customerPhone).trim() : null,
        plate_number: plateNumber ? String(plateNumber).trim().toUpperCase() : null,
        car_brand: carBrand ? String(carBrand).trim() : null,
        total_amount: totalAmount ? parseFloat(totalAmount) : 0,
        cashier_id: cashierId,
        cashier_name: cashierName,
        reason: reason.trim(),
        status: 'PENDING'
      }
    });

    // Catat ke Audit Log jika user login
    if (cashierId) {
      await prisma.auditLog.create({
        data: {
          user_id: cashierId,
          user_name: cashierName,
          action: 'REQUEST_DELETE_CUSTOMER',
          target_type: 'Transaction',
          target_id: parsedTrxId || newRequest.id,
          reason: reason.trim(),
          new_value: JSON.stringify({
            deletion_request_id: newRequest.id,
            customer_name: customerName,
            status: 'PENDING'
          })
        }
      }).catch(err => console.error('Error logging audit for deletion request:', err));
    }

    return res.status(201).json({
      success: true,
      message: 'Pengajuan hapus data customer berhasil dikirim ke Superadmin untuk persetujuan.',
      data: newRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/deletion-requests
 * Mengambil seluruh riwayat request hapus (filter: PENDING, APPROVED, REJECTED, atau ALL)
 */
const getDeletionRequests = async (req, res, next) => {
  try {
    const { status } = req.query;

    const whereClause = {};
    if (status && status !== 'ALL') {
      whereClause.status = status.toUpperCase();
    }

    const requests = await prisma.deletionRequest.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' }
    });

    // Ambil rekap total status
    const allReqs = await prisma.deletionRequest.findMany({
      select: { status: true }
    });

    const counts = {
      total: allReqs.length,
      pending: allReqs.filter(r => r.status === 'PENDING').length,
      approved: allReqs.filter(r => r.status === 'APPROVED').length,
      rejected: allReqs.filter(r => r.status === 'REJECTED').length
    };

    return res.json({
      success: true,
      data: requests,
      counts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /api/deletion-requests/:id/approve
 * Superadmin / Owner menyetujui request -> mengeksekusi DELETE riil pada transaksi & mengubah status menjadi APPROVED
 */
const approveDeletionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actionReason } = req.body;
    const reqId = parseInt(id, 10);

    const deletionReq = await prisma.deletionRequest.findUnique({
      where: { id: reqId }
    });

    if (!deletionReq) {
      return res.status(404).json({ success: false, message: 'Pengajuan hapus data tidak ditemukan.' });
    }

    if (deletionReq.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Pengajuan ini sudah pernah diproses sebelumnya (Status saat ini: ${deletionReq.status}).`
      });
    }

    const approverId = req.user?.id || req.user?.user_id || null;
    const approverName = req.user?.name || 'Superadmin';

    // ── Multiple Strategy Pencarian Transaksi Target ──
    let targetTrx = null;

    // Strategi 1: Cek langsung transaction_id jika ada
    if (deletionReq.transaction_id) {
      const candidate = await prisma.transaction.findUnique({
        where: { id: deletionReq.transaction_id }
      });
      if (candidate) {
        const cName = (candidate.customer_name || '').toLowerCase().trim();
        const rName = (deletionReq.customer_name || '').toLowerCase().trim();
        if (cName.includes(rName) || rName.includes(cName) || candidate.customer_phone === deletionReq.customer_phone) {
          targetTrx = candidate;
        }
      }
    }

    // Strategi 2: Parse trailing sequence number dari customer_id (e.g. "WRK/26-09-003-0312" -> 312)
    if (!targetTrx && deletionReq.customer_id) {
      const parts = String(deletionReq.customer_id).split(/[-/]/);
      const lastPart = parts[parts.length - 1];
      const match = lastPart.match(/\d+/);
      if (match) {
        const potentialId = parseInt(match[0], 10);
        const candidate = await prisma.transaction.findUnique({
          where: { id: potentialId }
        });
        if (candidate) {
          targetTrx = candidate;
        }
      }
    }

    // Strategi 3: Cari berdasarkan nama customer & plat / brand
    if (!targetTrx && deletionReq.customer_name) {
      const trimmedName = deletionReq.customer_name.trim();
      const candidates = await prisma.transaction.findMany({
        where: {
          customer_name: { contains: trimmedName }
        },
        orderBy: { id: 'desc' }
      });

      if (candidates.length === 1) {
        targetTrx = candidates[0];
      } else if (candidates.length > 1) {
        const carBrandReq = (deletionReq.car_brand || '').toLowerCase();
        const matched = candidates.find(c => {
          const cCar = `${c.car_brand || ''} ${c.car_model || ''}`.toLowerCase();
          return carBrandReq && (cCar.includes(carBrandReq) || carBrandReq.includes((c.car_model || '').toLowerCase()));
        });
        targetTrx = matched || candidates[0];
      }
    }

    // 1. Eksekusi Hapus Riil ke Database jika targetTrx ditemukan
    if (targetTrx) {
      const trxId = targetTrx.id;
      
      // Hapus relasi child secara bersih
      await prisma.transactionItem.deleteMany({ where: { transaction_id: trxId } }).catch(() => {});
      await prisma.payment.deleteMany({ where: { transaction_id: trxId } }).catch(() => {});
      await prisma.cashFlowLog.deleteMany({ 
        where: { 
          OR: [
            { referenceId: `TRX-${trxId}` },
            { referenceId: String(trxId) },
            { transaction_id: trxId }
          ]
        } 
      }).catch(() => {});
      await prisma.inventoryLog.deleteMany({ where: { transaction_id: trxId } }).catch(() => {});
      await prisma.complaint.deleteMany({ where: { transaction_id: trxId } }).catch(() => {});
      
      // Hapus record transaksi induk
      await prisma.transaction.delete({
        where: { id: trxId }
      });
    }

    // 2. Update status DeletionRequest menjadi APPROVED
    const updatedReq = await prisma.deletionRequest.update({
      where: { id: reqId },
      data: {
        status: 'APPROVED',
        transaction_id: targetTrx ? targetTrx.id : deletionReq.transaction_id,
        action_by_id: approverId,
        action_by_name: approverName,
        action_reason: actionReason ? actionReason.trim() : 'Disetujui oleh Superadmin / Owner',
        action_at: new Date()
      }
    });

    // 3. Catat ke Audit Log
    if (approverId) {
      await prisma.auditLog.create({
        data: {
          user_id: approverId,
          user_name: approverName,
          action: 'APPROVED_CUSTOMER_DELETION',
          target_type: 'Transaction',
          target_id: targetTrx ? targetTrx.id : (deletionReq.transaction_id || reqId),
          reason: deletionReq.reason,
          old_value: JSON.stringify({
            customer_name: deletionReq.customer_name,
            plate_number: deletionReq.plate_number,
            car_brand: deletionReq.car_brand,
            requested_by: deletionReq.cashier_name
          }),
          new_value: JSON.stringify({ status: 'APPROVED_DELETED', transaction_deleted_id: targetTrx?.id || null })
        }
      }).catch(err => console.error('Error logging audit for deletion approval:', err));
    }

    return res.json({
      success: true,
      message: `Persetujuan berhasil! Data customer "${deletionReq.customer_name}" dan transaksi terkait telah dihapus permanen.`,
      data: updatedReq
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. POST /api/deletion-requests/:id/reject
 * Superadmin / Owner menolak request hapus data customer
 */
const rejectDeletionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const reqId = parseInt(id, 10);

    const deletionReq = await prisma.deletionRequest.findUnique({
      where: { id: reqId }
    });

    if (!deletionReq) {
      return res.status(404).json({ success: false, message: 'Pengajuan hapus data tidak ditemukan.' });
    }

    if (deletionReq.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Pengajuan ini sudah pernah diproses sebelumnya (Status saat ini: ${deletionReq.status}).`
      });
    }

    const rejecterId = req.user?.id || req.user?.user_id || null;
    const rejecterName = req.user?.name || 'Superadmin';

    const updatedReq = await prisma.deletionRequest.update({
      where: { id: reqId },
      data: {
        status: 'REJECTED',
        action_by_id: rejecterId,
        action_by_name: rejecterName,
        action_reason: rejectionReason && rejectionReason.trim() ? rejectionReason.trim() : 'Ditolak oleh Superadmin / Owner',
        action_at: new Date()
      }
    });

    // Catat ke Audit Log
    if (rejecterId) {
      await prisma.auditLog.create({
        data: {
          user_id: rejecterId,
          user_name: rejecterName,
          action: 'REJECTED_CUSTOMER_DELETION',
          target_type: 'Transaction',
          target_id: deletionReq.transaction_id || reqId,
          reason: rejectionReason || 'Ditolak oleh Superadmin',
          new_value: JSON.stringify({ status: 'REJECTED' })
        }
      }).catch(err => console.error('Error logging audit for deletion rejection:', err));
    }

    return res.json({
      success: true,
      message: `Pengajuan hapus customer "${deletionReq.customer_name}" berhasil ditolak.`,
      data: updatedReq
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDeletionRequest,
  getDeletionRequests,
  approveDeletionRequest,
  rejectDeletionRequest
};
