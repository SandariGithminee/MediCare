const express = require("express");
const router = express.Router();
const {
    getLabTests,
    getLabTestById,
    createLabTest,
    updateLabTest,
    deleteLabTest,
} = require("../controllers/laboratoryController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/").get(protect, getLabTests).post(protect, authorize("admin", "doctor", "lab", "nurse", "staff"), createLabTest);
router
    .route("/:id")
    .get(protect, getLabTestById)
    .put(protect, authorize("admin", "doctor", "lab", "nurse", "staff"), updateLabTest)
    .delete(protect, authorize("admin", "lab", "doctor"), deleteLabTest);

module.exports = router;
