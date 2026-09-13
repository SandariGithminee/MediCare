const express = require("express");
const router = express.Router();
const {
    getMedicalRecords,
    getMedicalRecordById,
    createMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,
} = require("../controllers/medicalRecordController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/").get(protect, getMedicalRecords).post(protect, authorize("admin", "doctor", "nurse", "staff"), createMedicalRecord);
router
    .route("/:id")
    .get(protect, getMedicalRecordById)
    .put(protect, authorize("admin", "doctor", "nurse", "staff"), updateMedicalRecord)
    .delete(protect, authorize("admin", "doctor"), deleteMedicalRecord);

module.exports = router;
