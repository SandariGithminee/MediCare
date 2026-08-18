const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        category: { type: String, enum: ["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Equipment", "Other"], default: "Tablet" },
        manufacturer: { type: String, default: "" },
        batchNumber: { type: String, required: true },
        quantityInStock: { type: Number, required: true, default: 0 },
        minStockLevel: { type: Number, default: 10 },
        unitPrice: { type: Number, required: true },
        expiryDate: { type: Date, required: true },
        location: { type: String, default: "Main Pharmacy" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);
