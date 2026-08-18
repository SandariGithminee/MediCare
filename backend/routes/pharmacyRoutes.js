const express = require("express");
const router = express.Router();
const {
    getMedicines,
    getMedicineById,
    createMedicine,
    updateMedicine,
    deleteMedicine,
    dispenseMedicine,
} = require("../controllers/pharmacyController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getMedicines).post(protect, createMedicine);
router
    .route("/:id")
    .get(protect, getMedicineById)
    .put(protect, updateMedicine)
    .delete(protect, deleteMedicine);
router.post("/:id/dispense", protect, dispenseMedicine);

module.exports = router;
