const express = require("express");
const router = express.Router();
const {
  getBillings,
  getBillingById,
  createBilling,
  updateBilling,
  deleteBilling,
} = require("../controllers/billingController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getBillings).post(protect, createBilling);
router
  .route("/:id")
  .get(protect, getBillingById)
  .put(protect, updateBilling)
  .delete(protect, deleteBilling);

module.exports = router;
