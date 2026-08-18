const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        employeeId: { type: String, required: true, unique: true },
        role: {
            type: String,
            enum: ["Nurse", "Receptionist", "Lab Tech", "Pharmacist", "Accountant", "Admin", "Other"],
            default: "Nurse",
        },
        department: { type: String, default: "General" },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        salary: { type: Number, default: 30000 },
        joinDate: { type: Date, default: Date.now },
        status: { type: String, enum: ["Active", "On Leave", "Resigned"], default: "Active" },
        attendance: [
            {
                date: { type: Date, default: Date.now },
                status: { type: String, enum: ["Present", "Absent", "Leave"], default: "Present" },
            },
        ],
        leaveRequests: [
            {
                startDate: Date,
                endDate: Date,
                reason: String,
                status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);
