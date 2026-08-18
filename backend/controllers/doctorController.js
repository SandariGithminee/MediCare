const db = require("../config/db");

const mapDoctor = (d) => {
  if (!d) return null;
  return {
    _id: d.id,
    id: d.id,
    name: d.name,
    email: d.email,
    phone: d.phone,
    specialization: d.specialization,
    department: d.department,
    qualification: d.qualification,
    consultationFee: Number(d.consultation_fee || 0),
    availableDays: d.available_days || [],
    status: d.status,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
};

const getDoctors = async (req, res) => {
  try {
    const search = req.query.search;
    let queryText = "SELECT * FROM doctors ORDER BY created_at DESC";
    let params = [];

    if (search) {
      queryText = `
        SELECT * FROM doctors 
        WHERE name ILIKE $1 OR specialization ILIKE $1 OR department ILIKE $1 
        ORDER BY created_at DESC
      `;
      params = [`%${search}%`];
    }

    const { rows } = await db.query(queryText, params);
    res.json(rows.map(mapDoctor));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM doctors WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Doctor not found" });
    res.json(mapDoctor(rows[0]));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      specialization,
      department,
      qualification,
      consultationFee,
      availableDays,
      status,
    } = req.body;

    const { rows } = await db.query(
      `INSERT INTO doctors 
       (name, email, phone, specialization, department, qualification, consultation_fee, available_days, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        name,
        email,
        phone,
        specialization,
        department,
        qualification,
        consultationFee ? Number(consultationFee) : 0,
        availableDays || [],
        status || "Active",
      ]
    );

    res.status(201).json(mapDoctor(rows[0]));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      specialization,
      department,
      qualification,
      consultationFee,
      availableDays,
      status,
    } = req.body;

    const { rows } = await db.query(
      `UPDATE doctors SET 
       name = COALESCE($1, name),
       email = COALESCE($2, email),
       phone = COALESCE($3, phone),
       specialization = COALESCE($4, specialization),
       department = COALESCE($5, department),
       qualification = COALESCE($6, qualification),
       consultation_fee = COALESCE($7, consultation_fee),
       available_days = COALESCE($8, available_days),
       status = COALESCE($9, status),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        name,
        email,
        phone,
        specialization,
        department,
        qualification,
        consultationFee ? Number(consultationFee) : null,
        availableDays,
        status,
        req.params.id,
      ]
    );

    if (!rows.length) return res.status(404).json({ message: "Doctor not found" });
    res.json(mapDoctor(rows[0]));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteDoctor = async (req, res) => {
  try {
    const { rows } = await db.query("DELETE FROM doctors WHERE id = $1 RETURNING *", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Doctor not found" });
    res.json({ message: "Doctor removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDoctors, getDoctorById, createDoctor, updateDoctor, deleteDoctor, mapDoctor };
