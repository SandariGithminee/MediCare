const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  changePassword,
  getRegistrations,
  approveRegistration,
  rejectRegistration,
  deleteRegistration,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getProfile);
router.get("/profile", protect, getProfile);
router.put("/change-password", protect, changePassword);

// Admin user approval management routes
router.get("/registrations", protect, authorize("admin"), getRegistrations);
router.put("/registrations/:id/approve", protect, authorize("admin"), approveRegistration);
router.put("/registrations/:id/reject", protect, authorize("admin"), rejectRegistration);
router.delete("/registrations/:id", protect, authorize("admin"), deleteRegistration);

module.exports = router;
