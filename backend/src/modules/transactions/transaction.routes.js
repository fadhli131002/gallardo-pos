const express = require('express');
const router = express.Router();
const { getTransactions, createTransaction, deleteTransaction, updatePaymentStatus, updatePaymentStatusManual, updateTransaction } = require('./transaction.controller');
const { authenticateToken, authorizeRole } = require('../../middlewares/authMiddleware');

router.get('/', authenticateToken, getTransactions);
router.post('/', authenticateToken, createTransaction);
router.put('/:id', authenticateToken, updateTransaction);
router.put('/:id/payment-status-manual', authenticateToken, authorizeRole(['superadmin', 'owner']), updatePaymentStatusManual);
router.patch('/:id/pay', authenticateToken, updatePaymentStatus);
router.delete('/:id', authenticateToken, authorizeRole(['owner', 'superadmin']), deleteTransaction);

module.exports = router;
