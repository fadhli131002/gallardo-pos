const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('./audit.controller');
const { authenticateToken, authorizeRole } = require('../../middlewares/authMiddleware');

// Hanya Admin, Finance, Owner yang bisa lihat audit log
router.get('/logs', authenticateToken, authorizeRole(['admin', 'finance', 'owner']), getAuditLogs);

module.exports = router;
