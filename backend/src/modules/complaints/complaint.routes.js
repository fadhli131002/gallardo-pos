const express = require('express');
const router = express.Router();
const complaintController = require('./complaint.controller');
const { authenticateToken } = require('../../middlewares/authMiddleware');

router.get('/', authenticateToken, complaintController.getAllComplaints);
router.post('/', authenticateToken, complaintController.uploadMiddleware, complaintController.createComplaint);
router.put('/:id/status', authenticateToken, complaintController.updateStatus);

module.exports = router;
