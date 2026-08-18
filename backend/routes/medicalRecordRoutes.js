const express = require("express");
const router = express.Router();
const {
    getMedicalRecords,
    getMedicalRecordById,
    createMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,
} = require("../controllers/medicalRecordController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getMedicalRecords).post(protect, createMedicalRecord);
router
    .route("/:id")
    .get(protect, getMedicalRecordById)
    .put(protect, updateMedicalRecord)
    .delete(protect, deleteMedicalRecord);

module.exports = router;
