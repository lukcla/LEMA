const express = require('express');
const router = express.Router();

const leistungService = require('../services/leistung.service');

router.get('/', leistungService.getAllLeistungen);
router.get('/:id', leistungService.getLeistungById);
router.put('/:id', leistungService.updateLeistung);
router.delete('/:id', leistungService.deleteLeistung);

module.exports = router;