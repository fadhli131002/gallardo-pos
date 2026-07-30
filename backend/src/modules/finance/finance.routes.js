const express = require('express');
const router = express.Router();
const financeController = require('./finance.controller');
// const { authMiddleware, roleMiddleware } = require('../../middlewares/auth.middleware');

// Optional: you can add auth middleware here if needed
// router.use(authMiddleware);
// router.use(roleMiddleware(['finance', 'admin', 'superadmin']));

router.get('/dashboard', financeController.getDashboardSummary);
router.get('/receivables', financeController.getReceivables);
router.post('/refund', financeController.processRefund);
router.get('/refunds', financeController.getRefundHistory);
router.get('/commissions', financeController.getSalesCommissions);
router.patch('/commissions/:id', financeController.updateCommission);

module.exports = router;
