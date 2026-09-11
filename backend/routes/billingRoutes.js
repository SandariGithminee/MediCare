const express = require("express");
const router = express.Router();
const {
  getBillings,
  getBillingById,
  createBilling,
  updateBilling,
  deleteBilling,
} = require("../controllers/billingController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/").get(protect, getBillings).post(protect, authorize("admin", "accountant", "receptionist"), createBilling);
router
  .route("/:id")
  .get(protect, getBillingById)
  .put(protect, authorize("admin", "accountant", "receptionist", "cashier", "doctor", "nurse", "pharmacist"), updateBilling)
  .delete(protect, authorize("admin"), deleteBilling);

module.exports = router;
