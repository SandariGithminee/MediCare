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
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getStaff).post(protect, createStaff);
router
    .route("/:id")
    .get(protect, getStaffById)
    .put(protect, updateStaff)
    .delete(protect, deleteStaff);
router.post("/:id/attendance", protect, recordAttendance);
router.post("/:id/leave", protect, requestLeave);

module.exports = router;
