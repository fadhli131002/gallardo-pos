const express = require('express');
const router = express.Router();
const {
  getReleaseNotes,
  getLatestReleaseNote,
  createReleaseNote,
  updateReleaseNote,
  deleteReleaseNote,
  togglePublishReleaseNote
} = require('./releaseNote.controller');
const { authenticateToken, authorizeRole } = require('../../middlewares/authMiddleware');

// 1. Ambil 1 release note terbaru yang dipublikasikan (Semua user terautentikasi)
router.get('/latest', authenticateToken, getLatestReleaseNote);

// 2. Ambil daftar release notes (User biasa hanya melihat published, Admin/Superadmin melihat semua)
router.get('/', authenticateToken, getReleaseNotes);

// 3. Buat release note baru (Superadmin / Admin / Owner only)
router.post('/', authenticateToken, authorizeRole(['admin', 'superadmin', 'owner']), createReleaseNote);

// 4. Update release note (Superadmin / Admin / Owner only)
router.put('/:id', authenticateToken, authorizeRole(['admin', 'superadmin', 'owner']), updateReleaseNote);

// 5. Delete release note (Superadmin / Admin / Owner only)
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'superadmin', 'owner']), deleteReleaseNote);

// 6. Toggle status publish (Superadmin / Admin / Owner only)
router.patch('/:id/toggle-publish', authenticateToken, authorizeRole(['admin', 'superadmin', 'owner']), togglePublishReleaseNote);

module.exports = router;
