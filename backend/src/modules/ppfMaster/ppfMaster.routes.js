const express = require('express');
const router = express.Router();
const ppfMasterController = require('./ppfMaster.controller');

router.get('/', ppfMasterController.getAll);
router.get('/:id', ppfMasterController.getById);
router.post('/', ppfMasterController.create);
router.put('/:id', ppfMasterController.update);
router.delete('/:id', ppfMasterController.remove);

module.exports = router;
