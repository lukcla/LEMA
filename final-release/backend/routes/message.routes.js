const express = require("express");
const router = express.Router();

const messageService = require("../services/message.service");

router.post("/", messageService.sendMessage);

module.exports = router;