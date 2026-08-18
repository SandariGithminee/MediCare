// Run with: node seed.js
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const db = require("./config/db");

dotenv.config();

const seedData = async () => {
  try {
    console.log("🌱 Cleaning existing PostgreSQL tables...");
    await db.query("TRUNCATE TABLE users, patients, doctors, appointments, medical_records, laboratory, medicines, admissions, staff, billing, audit_logs CASCADE");

    console.log("🌱 Inserting users...");
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash("admin123", salt);
    const docHash = await bcrypt.hash("doctor123", salt);

    const userRes = await db.query(
      `INSERT INTO users (name, email, password, role) VALUES 
       ('Admin User', 'admin@medicare.com', $1, 'Admin'),
       ('Dr. Sarah Lin', 'doctor@medicare.com', $2, 'Doctor'),
       ('Front Desk', 'reception@medicare.com', $1, 'Receptionist')
       RETURNING id, email`,
      [passHash, docHash]
    );

    const doctorUserId = userRes.rows.find((u) => u.email === "doctor@medicare.com").id;

    console.log("🌱 Inserting doctors...");
    const doctorRes = await db.query(
      `INSERT INTO doctors (user_id, name, email, phone, specialization, department, qualification, consultation_fee, available_days, status) VALUES
       ($1, 'Dr. Sarah Lin', 'doctor@medicare.com', '+94 71 234 5678', 'Cardiologist', 'Cardiology', 'MD, FACC', 5000, ARRAY['Mon','Wed','Fri'], 'Active'),
       (NULL, 'Dr. James Carter', 'james@medicare.com', '+94 71 345 6789', 'Neurologist', 'Neurology', 'MD, PhD', 6000, ARRAY['Tue','Thu'], 'Active'),
       (NULL, 'Dr. Amara Perera', 'amara@medicare.com', '+94 71 456 7890', 'Pediatrician', 'Pediatrics', 'MBBS, DCH', 3500, ARRAY['Mon','Tue','Wed','Thu','Fri'], 'Active'),
       (NULL, 'Dr. Michael Fernando', 'michael@medicare.com', '+94 71 567 8901', 'Orthopedic Surgeon', 'Orthopedics', 'MS (Ortho)', 7000, ARRAY['Mon','Wed','Fri'], 'Active')
       RETURNING id, name`,
      [doctorUserId]
    );
    const doc1 = doctorRes.rows[0].id;
    const doc2 = doctorRes.rows[1].id;
    const doc3 = doctorRes.rows[2].id;

    console.log("🌱 Inserting patients...");
    const patientRes = await db.query(
      `INSERT INTO patients (first_name, last_name, email, phone, age, gender, address, blood_group, medical_history, emergency_contact, status) VALUES
       ('Nimal', 'Silva', 'nimal@example.com', '+94 77 111 2222', 35, 'Male', 'Colombo, Sri Lanka', 'O+', 'Hypertension history', '+94 77 000 1111', 'Admitted'),
       ('Kavya', 'Jayasuriya', 'kavya@example.com', '+94 77 222 3333', 28, 'Female', 'Kandy, Sri Lanka', 'A+', 'None', '+94 77 000 2222', 'Active'),
       ('Ruwan', 'Perera', 'ruwan@example.com', '+94 77 333 4444', 42, 'Male', 'Galle, Sri Lanka', 'B+', 'Knee joint pain', '+94 77 000 3333', 'Active')
       RETURNING id, first_name`,
    );
    const pat1 = patientRes.rows[0].id;
    const pat2 = patientRes.rows[1].id;
    const pat3 = patientRes.rows[2].id;

    console.log("🌱 Inserting appointments...");
    const apptRes = await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, reason, notes) VALUES
       ($1, $2, CURRENT_DATE, '10:00 AM', 'Confirmed', 'Routine heart checkup', 'Patient advised to bring previous reports'),
       ($3, $4, CURRENT_DATE + INTERVAL '1 day', '02:30 PM', 'Pending', 'Child vaccination', 'Check immunization chart'),
       ($5, $6, CURRENT_DATE - INTERVAL '1 day', '11:00 AM', 'Completed', 'Knee pain follow-up', 'X-Ray reviewed')
       RETURNING id`,
      [pat1, doc1, pat2, doc3, pat3, doc2]
    );
    const appt1 = apptRes.rows[0].id;

    console.log("🌱 Inserting medical records...");
    await db.query(
      `INSERT INTO medical_records (patient_id, doctor_id, appointment_id, record_date, diagnosis, symptoms, vitals, prescriptions, treatment_plan, notes) VALUES
       ($1, $2, $3, CURRENT_DATE, 'Mild Hypertension', 'Occasional chest tightness, fatigue',
        '{"bloodPressure": "135/85", "heartRate": "78 bpm", "temperature": "98.4 °F", "weight": "76 kg"}'::jsonb,
        '[{"medicineName": "Amlodipine", "dosage": "5mg", "frequency": "Once daily", "duration": "30 days", "instructions": "Take in the morning"}]'::jsonb,
        'Lifestyle modification and low sodium diet', 'Patient responds well to treatment.')`,
      [pat1, doc1, appt1]
    );

    console.log("🌱 Inserting laboratory tests...");
    await db.query(
      `INSERT INTO laboratory (patient_id, doctor_id, test_name, test_category, sample_details, result_value, normal_range, unit, status, requested_date, completed_at, technician_notes, cost) VALUES
       ($1, $2, 'Lipid Profile Panel', 'Blood', 'Venous blood sample', 'Cholesterol: 195 mg/dL, HDL: 45 mg/dL', 'Total < 200 mg/dL', 'mg/dL', 'Completed', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP, 'Fasting sample processed.', 2500),
       ($3, $4, 'Complete Blood Count (CBC)', 'Blood', 'Capillary blood', NULL, 'WBC: 4,500-11,000', 'cells/mcL', 'Requested', CURRENT_TIMESTAMP, NULL, NULL, 1800)`,
      [pat1, doc1, pat2, doc3]
    );

    console.log("🌱 Inserting medicines...");
    await db.query(
      `INSERT INTO medicines (name, category, manufacturer, batch_number, quantity_in_stock, min_stock_level, unit_price, expiry_date, location) VALUES
       ('Paracetamol 500mg', 'Tablet', 'GSK', 'B1049', 250, 50, 15.00, '2027-12-31', 'Main Pharmacy'),
       ('Amoxicillin 500mg', 'Capsule', 'Novartis', 'B8832', 8, 20, 45.00, '2026-11-30', 'Main Pharmacy'),
       ('Metformin 500mg', 'Tablet', 'Sun Pharma', 'B7711', 120, 30, 20.00, '2027-08-15', 'Main Pharmacy'),
       ('Insulin Injection', 'Injection', 'Novo Nordisk', 'B9012', 4, 10, 1200.00, '2026-10-01', 'Cold Storage')`
    );

    console.log("🌱 Inserting admissions...");
    await db.query(
      `INSERT INTO admissions (patient_id, doctor_id, room_number, bed_number, admission_date, status, reason, daily_rate, notes) VALUES
       ($1, $2, 'ICU-02', 'B-01', CURRENT_TIMESTAMP, 'Admitted', 'Severe hypertension monitoring', 1500.00, 'Under continuous cardiac telemetry monitoring.')`,
      [pat1, doc1]
    );

    console.log("🌱 Inserting staff...");
    await db.query(
      `INSERT INTO staff (employee_id, name, role, department, email, phone, salary, join_date, status) VALUES
       ('EMP-0101', 'Sister Mary Gomez', 'Nurse', 'ICU', 'mary@medicare.com', '+94 77 888 9991', 45000.00, '2023-01-15', 'Active'),
       ('EMP-0102', 'Johnathan Wick', 'Lab Tech', 'Pathology', 'john@medicare.com', '+94 77 888 9992', 40000.00, '2023-03-01', 'Active'),
       ('EMP-0103', 'Elena Rostova', 'Pharmacist', 'Pharmacy', 'elena@medicare.com', '+94 77 888 9993', 42000.00, '2023-05-10', 'Active')`
    );

    console.log("🌱 Inserting billing records...");
    await db.query(
      `INSERT INTO billing (invoice_number, patient_id, items, total_amount, paid_amount, status, payment_method) VALUES
       ('INV-00001', $1, '[{"description": "Cardiology Consultation", "category": "Consultation", "amount": 5000}, {"description": "Lipid Profile Test", "category": "Laboratory", "amount": 2500}]'::jsonb, 7500.00, 7500.00, 'Paid', 'Card'),
       ('INV-00002', $2, '[{"description": "Pediatric Consultation", "category": "Consultation", "amount": 3500}, {"description": "Paracetamol Syrup", "category": "Pharmacy", "amount": 1200}]'::jsonb, 4700.00, 2000.00, 'Partial', 'Cash')`,
      [pat1, pat2]
    );

    console.log("🌱 Inserting audit logs...");
    await db.query(
      `INSERT INTO audit_logs (user_name, role, action, details, ip_address) VALUES
       ('admin@medicare.com', 'Admin', 'System Migration', 'Migrated database to Neon PostgreSQL', '127.0.0.1')`
    );

    console.log("✅ Neon PostgreSQL database seeded successfully with realistic Medicare demo data!");
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seedData();
