const express = require("express");
const router = express.Router();
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} = require("../controllers/patientController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/").get(protect, getPatients).post(protect, authorize("admin", "doctor", "nurse", "receptionist"), createPatient);
router
  .route("/:id")
  .get(protect, getPatientById)
  .put(protect, authorize("admin", "doctor", "nurse", "receptionist"), updatePatient)
  .delete(protect, authorize("admin"), deletePatient);

module.exports = router;
