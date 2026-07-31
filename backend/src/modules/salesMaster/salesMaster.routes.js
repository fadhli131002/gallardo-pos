const express = require('express');
const router = express.Router();
const salesMasterController = require('./salesMaster.controller');
const { authenticateToken } = require('../../middlewares/authMiddleware');

router.get('/', authenticateToken, salesMasterController.getSalesMaster);
router.post('/', authenticateToken, salesMasterController.addSalesMaster);
router.put('/:id', authenticateToken, salesMasterController.updateSalesMaster);
router.delete('/:id', authenticateToken, salesMasterController.deleteSalesMaster);

module.exports = router;
