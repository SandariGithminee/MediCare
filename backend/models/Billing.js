const mongoose = require("mongoose");

const billingSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    items: [
      {
        description: String,
        category: { type: String, enum: ["Consultation", "Laboratory", "Pharmacy", "Admission", "Other"] },
        amount: Number,
      },
    ],
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    status: { type: String, enum: ["Paid", "Pending", "Partial"], default: "Pending" },
    paymentMethod: { type: String, enum: ["Cash", "Card", "Insurance", "Online"], default: "Cash" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Billing", billingSchema);
