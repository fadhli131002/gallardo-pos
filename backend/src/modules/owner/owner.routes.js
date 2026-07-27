const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../middlewares/authMiddleware');
const ownerController = require('./owner.controller');

// Dashboard Summary & Charts
router.use(authenticateToken);
router.use(authorizeRole(['owner', 'superadmin', 'admin']));

// Dashboard Summary & Charts
router.get('/dashboard-summary', ownerController.getDashboardSummary);
router.get('/profit-loss', ownerController.getProfitLossChart);

// Expenses
router.get('/expenses', ownerController.getExpenses);
router.post('/expenses', ownerController.addExpense);

// Purchase Orders
router.get('/purchase-orders', ownerController.getPurchaseOrders);
router.post('/purchase-orders', ownerController.addPurchaseOrder);

module.exports = router;
