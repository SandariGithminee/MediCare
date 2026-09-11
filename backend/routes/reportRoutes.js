const express = require("express");
const router = express.Router();
const {
    getReportsSummary,
    getPatientReports,
    getAppointmentReports,
    getRevenueReports,
    getPharmacyReports,
    getLaboratoryReports,
    getStaffReports,
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");

// 3.10 Reports Endpoints
router.get("/summary", protect, getReportsSummary);
router.get("/patients", protect, getPatientReports);
router.get("/appointments", protect, getAppointmentReports);
router.get("/revenue", protect, getRevenueReports);
router.get("/pharmacy", protect, getPharmacyReports);
router.get("/laboratory", protect, getLaboratoryReports);
router.get("/staff", protect, getStaffReports);

module.exports = router;
