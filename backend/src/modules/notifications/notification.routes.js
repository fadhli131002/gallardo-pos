const express = require('express');
const router = express.Router();
const {
  warnSalesForDuplicate,
  getMyWarnings,
  getAllWarnings,
  markAsRead
} = require('./notification.controller');
const { authenticateToken, authorizeRole } = require('../../middlewares/authMiddleware');

router.post('/warn-sales', authenticateToken, authorizeRole(['admin', 'superadmin', 'owner']), warnSalesForDuplicate);
router.get('/my-warnings', authenticateToken, getMyWarnings);
router.get('/all-warnings', authenticateToken, authorizeRole(['admin', 'superadmin', 'owner']), getAllWarnings);
router.put('/:id/read', authenticateToken, markAsRead);

module.exports = router;
