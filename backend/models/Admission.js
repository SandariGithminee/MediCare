const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema(
    {
        patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
        roomNumber: { type: String, required: true },
        bedNumber: { type: String, required: true },
        admissionDate: { type: Date, default: Date.now },
        dischargeDate: { type: Date },
        reason: { type: String, required: true },
        dailyRate: { type: Number, default: 500 },
        status: { type: String, enum: ["Admitted", "Discharged", "Transferred"], default: "Admitted" },
        notes: { type: String, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Admission", admissionSchema);
