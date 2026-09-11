const express = require("express");
const router = express.Router();
const {
    getMedicines,
    getMedicineById,
    createMedicine,
    updateMedicine,
    deleteMedicine,
    dispenseMedicine,
    getPrescriptions,
    dispensePrescription,
} = require("../controllers/pharmacyController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Prescription processing routes (Must be placed before /:id)
router.get("/prescriptions", protect, getPrescriptions);
router.post("/prescriptions/:recordId/dispense", protect, authorize("admin", "pharmacist", "doctor"), dispensePrescription);

router.route("/").get(protect, getMedicines).post(protect, authorize("admin", "pharmacist"), createMedicine);
router
    .route("/:id")
    .get(protect, getMedicineById)
    .put(protect, authorize("admin", "pharmacist"), updateMedicine)
    .delete(protect, authorize("admin", "pharmacist"), deleteMedicine);
router.post("/:id/dispense", protect, authorize("admin", "pharmacist", "doctor"), dispenseMedicine);

module.exports = router;
