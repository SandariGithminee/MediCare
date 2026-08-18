const express = require("express");
const router = express.Router();
const { getReportsSummary } = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");

router.get("/summary", protect, getReportsSummary);

module.exports = router;
