const express = require("express");
const { ping, pingFileverse } = require("../controllers/systemController");

const router = express.Router();

router.get("/ping", ping);
router.get("/ping/fileverse", pingFileverse);

module.exports = router;

