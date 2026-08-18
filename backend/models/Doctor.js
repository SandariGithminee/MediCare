const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    department: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    experience: { type: Number, default: 0 },
    fee: { type: Number, default: 0 },
    photo: { type: String, default: "" },
    availableDays: [{ type: String }],
    availableTime: { type: String, default: "9:00 AM - 5:00 PM" },
    rating: { type: Number, default: 4.5 },
    status: { type: String, enum: ["Active", "On Leave", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
