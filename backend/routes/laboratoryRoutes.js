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

router.route("/").get(protect, getLabTests).post(protect, authorize("admin", "doctor", "lab"), createLabTest);
router
    .route("/:id")
    .get(protect, getLabTestById)
    .put(protect, authorize("admin", "doctor", "lab"), updateLabTest)
    .delete(protect, authorize("admin"), deleteLabTest);

module.exports = router;
