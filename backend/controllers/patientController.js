const db = require("../config/db");

const mapPatient = (p) => {
  if (!p) return null;
  return {
    _id: p.id,
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    email: p.email,
    phone: p.phone,
    age: p.age,
    gender: p.gender,
    address: p.address,
    bloodGroup: p.blood_group,
    medicalHistory: p.medical_history,
    emergencyContact: p.emergency_contact,
    status: p.status,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
};

const getPatients = async (req, res) => {
  try {
    const search = req.query.search;
    let queryText = "SELECT * FROM patients ORDER BY created_at DESC";
    let params = [];

    if (search) {
      queryText = `
        SELECT * FROM patients 
        WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR phone ILIKE $1 
        ORDER BY created_at DESC
      `;
      params = [`%${search}%`];
    }

    const { rows } = await db.query(queryText, params);
    res.json(rows.map(mapPatient));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPatientById = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM patients WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Patient not found" });
    res.json(mapPatient(rows[0]));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPatient = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      age,
      gender,
      address,
      bloodGroup,
      medicalHistory,
      emergencyContact,
      status,
    } = req.body;

    const { rows } = await db.query(
      `INSERT INTO patients 
       (first_name, last_name, email, phone, age, gender, address, blood_group, medical_history, emergency_contact, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [
        firstName,
        lastName,
        email,
        phone,
        Number(age),
        gender,
        address,
        bloodGroup,
        medicalHistory,
        emergencyContact,
        status || "Active",
      ]
    );

    res.status(201).json(mapPatient(rows[0]));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updatePatient = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      age,
      gender,
      address,
      bloodGroup,
      medicalHistory,
      emergencyContact,
      status,
    } = req.body;

    const { rows } = await db.query(
      `UPDATE patients SET 
       first_name = COALESCE($1, first_name),
       last_name = COALESCE($2, last_name),
       email = COALESCE($3, email),
       phone = COALESCE($4, phone),
       age = COALESCE($5, age),
       gender = COALESCE($6, gender),
       address = COALESCE($7, address),
       blood_group = COALESCE($8, blood_group),
       medical_history = COALESCE($9, medical_history),
       emergency_contact = COALESCE($10, emergency_contact),
       status = COALESCE($11, status),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [
        firstName,
        lastName,
        email,
        phone,
        age ? Number(age) : null,
        gender,
        address,
        bloodGroup,
        medicalHistory,
        emergencyContact,
        status,
        req.params.id,
      ]
    );

    if (!rows.length) return res.status(404).json({ message: "Patient not found" });
    res.json(mapPatient(rows[0]));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deletePatient = async (req, res) => {
  try {
    const { rows } = await db.query("DELETE FROM patients WHERE id = $1 RETURNING *", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Patient not found" });
    res.json({ message: "Patient removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPatients, getPatientById, createPatient, updatePatient, deletePatient, mapPatient };
