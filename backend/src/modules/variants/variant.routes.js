const express = require('express');
const router = express.Router();
const variantController = require('./variant.controller');

// Peruntukan
router.get('/peruntukan', variantController.getPeruntukan);
router.post('/peruntukan', variantController.createPeruntukan);
router.put('/peruntukan/:id', variantController.updatePeruntukan);
router.delete('/peruntukan/:id', variantController.deletePeruntukan);

// Posisi
router.get('/posisi', variantController.getPosisi);
router.post('/posisi', variantController.createPosisi);
router.delete('/posisi/:id', variantController.deletePosisi);

// Partial
router.get('/partial', variantController.getPartial);
router.post('/partial', variantController.createPartial);
router.delete('/partial/:id', variantController.deletePartial);

module.exports = router;
