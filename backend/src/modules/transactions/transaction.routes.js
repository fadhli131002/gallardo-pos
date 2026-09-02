const express = require('express');
const router = express.Router();
const { getTransactions, getTransactionById, getPublicTransactionById, createTransaction, deleteTransaction, updatePaymentStatus, updatePaymentStatusManual, updateTransaction, updateTransactionPrice, processPaymentBalance } = require('./transaction.controller');
const { authenticateToken, authorizeRole } = require('../../middlewares/authMiddleware');

router.get('/public/:id', getPublicTransactionById);
router.get('/', authenticateToken, getTransactions);
router.get('/:id', authenticateToken, getTransactionById);
router.post('/', authenticateToken, createTransaction);
router.put('/:id', authenticateToken, updateTransaction);
router.put('/:id/price', authenticateToken, updateTransactionPrice);
router.put('/:id/payment-status-manual', authenticateToken, authorizeRole(['superadmin', 'owner', 'admin']), updatePaymentStatusManual);
router.patch('/:id/pay', authenticateToken, updatePaymentStatus);
router.post('/:id/pay-balance', authenticateToken, processPaymentBalance);
router.delete('/:id', authenticateToken, authorizeRole(['owner', 'superadmin', 'admin']), deleteTransaction);

module.exports = router;
