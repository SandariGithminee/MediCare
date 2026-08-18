const express = require("express");
const router = express.Router();
const {
    getLabTests,
    getLabTestById,
    createLabTest,
    updateLabTest,
    deleteLabTest,
} = require("../controllers/laboratoryController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getLabTests).post(protect, createLabTest);
router
    .route("/:id")
    .get(protect, getLabTestById)
    .put(protect, updateLabTest)
    .delete(protect, deleteLabTest);

module.exports = router;
