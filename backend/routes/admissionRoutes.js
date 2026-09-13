const express = require("express");
const router = express.Router();
const {
    getAdmissions,
    getAdmissionById,
    createAdmission,
    updateAdmission,
    deleteAdmission,
} = require("../controllers/admissionController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/").get(protect, getAdmissions).post(protect, authorize("admin", "doctor", "nurse", "receptionist", "staff"), createAdmission);
router
    .route("/:id")
    .get(protect, getAdmissionById)
    .put(protect, authorize("admin", "doctor", "nurse", "receptionist", "staff"), updateAdmission)
    .delete(protect, authorize("admin", "doctor", "hr"), deleteAdmission);

module.exports = router;
