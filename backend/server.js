const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const { connectDB } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ message: "🏥 Medicare Hospital Management System API is running..." });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/billing", require("./routes/billingRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/medical-records", require("./routes/medicalRecordRoutes"));
app.use("/api/laboratory", require("./routes/laboratoryRoutes"));
app.use("/api/pharmacy", require("./routes/pharmacyRoutes"));
app.use("/api/admissions", require("./routes/admissionRoutes"));
app.use("/api/staff", require("./routes/staffRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/audit-logs", require("./routes/auditLogRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Medicare server running on port ${PORT}`);
  });
}

module.exports = app;

