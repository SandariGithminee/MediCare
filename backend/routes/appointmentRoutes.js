const express = require("express");
const router = express.Router();
const {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require("../controllers/appointmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/").get(protect, getAppointments).post(protect, authorize("admin", "doctor", "nurse", "receptionist", "staff", "hr"), createAppointment);
router
  .route("/:id")
  .get(protect, getAppointmentById)
  .put(protect, authorize("admin", "doctor", "nurse", "receptionist", "staff", "hr"), updateAppointment)
  .delete(protect, authorize("admin", "doctor", "receptionist", "hr"), deleteAppointment);

module.exports = router;
