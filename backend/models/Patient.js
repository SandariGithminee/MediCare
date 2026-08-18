const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    dateOfBirth: { type: Date, required: true },
    bloodGroup: { type: String, default: "" },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
    photo: { type: String, default: "" },
    medicalHistory: [
      {
        diagnosis: String,
        treatment: String,
        date: { type: Date, default: Date.now },
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
        notes: String,
      },
    ],
    status: { type: String, enum: ["Active", "Discharged", "Admitted"], default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
