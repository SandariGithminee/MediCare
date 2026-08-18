const express = require("express");
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require("../controllers/doctorController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getDoctors).post(protect, createDoctor);
router
  .route("/:id")
  .get(protect, getDoctorById)
  .put(protect, updateDoctor)
  .delete(protect, deleteDoctor);

module.exports = router;
