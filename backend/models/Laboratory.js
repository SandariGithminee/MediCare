const mongoose = require("mongoose");

const laboratorySchema = new mongoose.Schema(
    {
        patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
        testName: { type: String, required: true },
        testCategory: { type: String, enum: ["Blood", "Urine", "Radiology", "Pathology", "Biochemistry", "Other"], default: "Blood" },
        requestedDate: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ["Requested", "Sample Collected", "In Progress", "Completed", "Cancelled"],
            default: "Requested",
        },
        sampleDetails: { type: String, default: "" },
        sampleCollectedAt: { type: Date },
        resultValue: { type: String, default: "" },
        normalRange: { type: String, default: "" },
        unit: { type: String, default: "" },
        technicianNotes: { type: String, default: "" },
        cost: { type: Number, default: 0 },
        completedAt: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Laboratory", laboratorySchema);
