const express = require("express");
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require("../controllers/doctorController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/").get(protect, getDoctors).post(protect, authorize("admin", "doctor", "hr", "receptionist", "staff"), createDoctor);
router
  .route("/:id")
  .get(protect, getDoctorById)
  .put(protect, authorize("admin", "doctor", "hr", "receptionist", "staff"), updateDoctor)
  .delete(protect, authorize("admin", "hr", "doctor"), deleteDoctor);

module.exports = router;
