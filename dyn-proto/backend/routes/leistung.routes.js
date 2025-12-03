const express = require("express");
const router = express.Router();

const leistungService = require("../services/leistung.service");

router.get("/", leistungService.listLeistungen);
router.get("/:id", leistungService.getLeistungById);

module.exports = router;