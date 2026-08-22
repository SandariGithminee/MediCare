const express = require("express");
const router = express.Router();
const {
    getStaff,
    getStaffById,
    createStaff,
    updateStaff,
    deleteStaff,
    recordAttendance,
    requestLeave,
} = require("../controllers/staffController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/").get(protect, getStaff).post(protect, authorize("admin"), createStaff);
router
    .route("/:id")
    .get(protect, getStaffById)
    .put(protect, authorize("admin"), updateStaff)
    .delete(protect, authorize("admin"), deleteStaff);
router.post("/:id/attendance", protect, authorize("admin"), recordAttendance);
router.post("/:id/leave", protect, requestLeave);

module.exports = router;
