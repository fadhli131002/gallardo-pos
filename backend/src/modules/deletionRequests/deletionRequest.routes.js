const express = require('express');
const router = express.Router();
const {
  createDeletionRequest,
  getDeletionRequests,
  approveDeletionRequest,
  rejectDeletionRequest
} = require('./deletionRequest.controller');
const { authenticateToken, authorizeRole } = require('../../middlewares/authMiddleware');

// 1. Kasir / Sales / Admin / Superadmin dapat mengajukan permintaan hapus
router.post('/', authenticateToken, createDeletionRequest);

// 2. Mengambil daftar request
router.get('/', authenticateToken, getDeletionRequests);

// 3. Superadmin / Owner / Admin menyetujui request & eksekusi hapus riil ke DB
router.post('/:id/approve', authenticateToken, authorizeRole(['admin', 'superadmin', 'owner']), approveDeletionRequest);

// 4. Superadmin / Owner / Admin menolak request hapus
router.post('/:id/reject', authenticateToken, authorizeRole(['admin', 'superadmin', 'owner']), rejectDeletionRequest);

module.exports = router;
