const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "Stethoscope" },
    headDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", departmentSchema);
