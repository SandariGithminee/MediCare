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

router.route("/").get(protect, getAppointments).post(protect, authorize("admin", "doctor", "receptionist"), createAppointment);
router
  .route("/:id")
  .get(protect, getAppointmentById)
  .put(protect, authorize("admin", "doctor", "receptionist"), updateAppointment)
  .delete(protect, authorize("admin"), deleteAppointment);

module.exports = router;
