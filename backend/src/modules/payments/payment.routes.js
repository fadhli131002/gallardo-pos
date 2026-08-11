const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { authenticateToken, authorizeRole } = require('../../middlewares/authMiddleware');

router.post('/:transactionId', authenticateToken, authorizeRole(['finance', 'admin']), paymentController.createPayment);
router.put('/:id', authenticateToken, authorizeRole(['sales', 'admin', 'superadmin', 'owner', 'finance']), paymentController.updatePayment);

module.exports = router;
