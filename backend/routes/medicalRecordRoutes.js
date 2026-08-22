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

router.route("/").get(protect, getMedicalRecords).post(protect, authorize("admin", "doctor"), createMedicalRecord);
router
    .route("/:id")
    .get(protect, getMedicalRecordById)
    .put(protect, authorize("admin", "doctor"), updateMedicalRecord)
    .delete(protect, authorize("admin"), deleteMedicalRecord);

module.exports = router;
