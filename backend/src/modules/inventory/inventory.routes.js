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

// GET /api/inventory — data inventaris dapat dibaca oleh sales, admin, superadmin, owner, finance, inventory
router.get('/',          authenticateToken, authorizeRole(['sales', 'admin', 'superadmin', 'owner', 'finance', 'inventory']), getInventory);
router.get('/low-stock', authenticateToken, authorizeRole(['admin', 'superadmin', 'owner', 'finance', 'inventory']), getLowStockAlert);
router.get('/logs',      authenticateToken, authorizeRole(['admin', 'superadmin', 'owner', 'finance', 'inventory']), getInventoryLogs);
router.post('/',         authenticateToken, authorizeRole(['admin', 'superadmin', 'inventory']), createInventoryItem);
router.put('/:id',       authenticateToken, authorizeRole(['admin', 'superadmin', 'owner', 'finance', 'inventory']), updateInventoryStock);
router.delete('/:id',    authenticateToken, authorizeRole(['admin', 'superadmin']), deleteInventoryItem);

module.exports = router;
