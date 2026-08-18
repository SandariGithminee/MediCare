const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
    {
        patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
        recordDate: { type: Date, default: Date.now },
        diagnosis: { type: String, required: true },
        symptoms: { type: String, default: "" },
        treatmentPlan: { type: String, default: "" },
        prescriptions: [
            {
                medicineName: { type: String, required: true },
                dosage: { type: String, required: true },
                frequency: { type: String, default: "Once daily" },
                duration: { type: String, default: "7 days" },
                instructions: { type: String, default: "Take after meals" },
            },
        ],
        vitalSigns: {
            bloodPressure: { type: String, default: "120/80" },
            heartRate: { type: String, default: "72 bpm" },
            temperature: { type: String, default: "98.6 °F" },
            weight: { type: String, default: "70 kg" },
        },
        notes: { type: String, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
