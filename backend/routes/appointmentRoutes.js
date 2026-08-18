const express = require("express");
const router = express.Router();
const {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require("../controllers/appointmentController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getAppointments).post(protect, createAppointment);
router
  .route("/:id")
  .get(protect, getAppointmentById)
  .put(protect, updateAppointment)
  .delete(protect, deleteAppointment);

module.exports = router;
