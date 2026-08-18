const express = require('express');
const {
  getInventory,
  getLowStockAlert,
  getInventoryLogs,
  updateInventoryStock,
  createInventoryItem,
  deleteInventoryItem
} = require('./inventory.controller');
const { authenticateToken, authorizeRole } = require('../../middlewares/authMiddleware');

const router = express.Router();

// GET /api/inventory — data inventaris dapat dibaca oleh sales, admin, superadmin, owner, finance
router.get('/',          authenticateToken, authorizeRole(['sales', 'admin', 'superadmin', 'owner', 'finance']), getInventory);
router.get('/low-stock', authenticateToken, authorizeRole(['admin', 'superadmin', 'owner', 'finance']), getLowStockAlert);
router.get('/logs',      authenticateToken, authorizeRole(['admin', 'superadmin', 'owner', 'finance']), getInventoryLogs);
router.post('/',         authenticateToken, authorizeRole(['admin', 'superadmin']), createInventoryItem);
router.put('/:id',       authenticateToken, authorizeRole(['admin', 'superadmin', 'owner', 'finance']), updateInventoryStock);
router.delete('/:id',    authenticateToken, authorizeRole(['admin', 'superadmin']), deleteInventoryItem);

module.exports = router;
