const express = require("express");
const router = express.Router();
const {
    getAdmissions,
    getAdmissionById,
    createAdmission,
    updateAdmission,
    deleteAdmission,
} = require("../controllers/admissionController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getAdmissions).post(protect, createAdmission);
router
    .route("/:id")
    .get(protect, getAdmissionById)
    .put(protect, updateAdmission)
    .delete(protect, deleteAdmission);

module.exports = router;
