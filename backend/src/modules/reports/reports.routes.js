const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const { authenticateToken, authorizeRole } = require('../../middlewares/authMiddleware');

// Route khusus role admin & finance (opsional, karena owner juga bisa via Owner Portal, tapi ini untuk Admin)
router.use(authenticateToken);
router.use(authorizeRole(['admin', 'superadmin', 'owner', 'finance']));

router.get('/monthly/omset', reportsController.getNetRevenue);
router.get('/monthly/sales-by-product', reportsController.getSalesByProduct);
router.get('/monthly/stock-mutation', reportsController.getStockMutation);
router.get('/monthly/invoices', reportsController.getInvoiceList);
router.get('/monthly/complaints', reportsController.getComplaints);

module.exports = router;
