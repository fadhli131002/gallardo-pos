const express = require('express');
const { getCustomerRanking, getDashboardStats, getSalesDashboardStats } = require('./analytics.controller');
const { authenticateToken, authorizeRole } = require('../../middlewares/authMiddleware');

const router = express.Router();

router.get('/customer-ranking', authenticateToken, authorizeRole(['admin', 'superadmin', 'finance']), getCustomerRanking);
router.get('/dashboard', authenticateToken, getDashboardStats);
router.get('/sales-dashboard', authenticateToken, authorizeRole(['sales', 'admin', 'superadmin']), getSalesDashboardStats);

module.exports = router;
