const express = require('express');
const router = express.Router();
const salesCategoryController = require('./salesCategory.controller');

router.get('/', salesCategoryController.getAllSalesCategories);
router.post('/', salesCategoryController.createSalesCategory);
router.delete('/:id', salesCategoryController.deleteSalesCategory);

module.exports = router;
