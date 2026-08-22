const express = require("express");
const router = express.Router();
const { getAuditLogs, createAuditLog } = require("../controllers/auditLogController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/").get(protect, authorize("admin"), getAuditLogs).post(protect, createAuditLog);

module.exports = router;
