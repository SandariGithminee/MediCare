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
    updateLeaveStatus,
    deleteLeave,
} = require("../controllers/staffController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/").get(protect, getStaff).post(protect, authorize("admin", "hr", "receptionist", "staff", "doctor", "nurse", "accountant", "cashier", "lab", "pharmacist"), createStaff);
router
    .route("/:id")
    .get(protect, getStaffById)
    .put(protect, authorize("admin", "hr", "receptionist", "staff", "doctor", "nurse", "accountant", "cashier", "lab", "pharmacist"), updateStaff)
    .delete(protect, authorize("admin", "hr"), deleteStaff);
router.post("/:id/attendance", protect, recordAttendance);
router.post("/:id/leave", protect, requestLeave);
router.put("/:id/leave/:leaveId", protect, updateLeaveStatus);
router.delete("/:id/leave/:leaveId", protect, authorize("admin", "hr"), deleteLeave);

module.exports = router;
