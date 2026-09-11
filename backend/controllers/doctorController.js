const db = require("../config/db");
const { formatErrorMessage } = require("../utils/errorHandler");

const mapDoctor = (d) => {
  if (!d) return null;
  const fee = Number(d.consultation_fee || 0);
  const exp = d.experience !== null && d.experience !== undefined ? Number(d.experience) : 0;
  const rating = d.rating !== null && d.rating !== undefined ? Number(d.rating) : 4.8;
  return {
    _id: d.id,
    id: d.id,
    name: d.name,
    email: d.email,
    phone: d.phone,
    specialization: d.specialization,
    department: d.department,
    qualification: d.qualification,
    consultationFee: fee,
    fee: fee,
    experience: exp,
    rating: rating,
    photo: d.photo || null,
    availableTime: d.available_time || "9:00 AM - 5:00 PM",
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
    res.status(500).json({ message: formatErrorMessage(error) });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM doctors WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Doctor not found." });
    res.json(mapDoctor(rows[0]));
  } catch (error) {
    res.status(500).json({ message: formatErrorMessage(error) });
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
      fee,
      experience,
      photo,
      rating,
      availableTime,
      availableDays,
      status,
    } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Doctor name is required (at least 2 characters)." });
    }
    if (!specialization || specialization.trim() === "") {
      return res.status(400).json({ message: "Specialization is required." });
    }
    if (!department || department.trim() === "") {
      return res.status(400).json({ message: "Department is required." });
    }

    if (phone) {
      const rawDigits = phone.replace(/[^0-9]/g, "");
      if (rawDigits.length !== 10) {
        return res.status(400).json({ message: "Phone number must be exactly 10 digits." });
      }
    }

    const rawFee = fee !== undefined && fee !== null && fee !== "" ? fee : consultationFee;
    const feeVal = rawFee !== undefined && rawFee !== null && rawFee !== "" ? Number(rawFee) : 0;
    const expVal = experience !== undefined && experience !== null && experience !== "" ? Number(experience) : 0;
    const ratingVal = rating !== undefined && rating !== null && rating !== "" ? Number(rating) : 4.8;
    const timeVal = availableTime && availableTime.trim() ? availableTime.trim() : "9:00 AM - 5:00 PM";
    const photoVal = photo && photo.trim() ? photo.trim() : null;

    const { rows } = await db.query(
      `INSERT INTO doctors 
       (name, email, phone, specialization, department, qualification, consultation_fee, experience, rating, photo, available_time, available_days, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [
        name.trim(),
        email ? email.trim() : null,
        phone ? phone.trim() : null,
        specialization.trim(),
        department.trim(),
        qualification ? qualification.trim() : null,
        feeVal,
        expVal,
        ratingVal,
        photoVal,
        timeVal,
        availableDays || [],
        status || "Active",
      ]
    );

    res.status(201).json(mapDoctor(rows[0]));
  } catch (error) {
    res.status(400).json({ message: formatErrorMessage(error) });
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
      fee,
      experience,
      photo,
      rating,
      availableTime,
      availableDays,
      status,
    } = req.body;

    if (phone) {
      const rawDigits = phone.replace(/[^0-9]/g, "");
      if (rawDigits.length !== 10) {
        return res.status(400).json({ message: "Phone number must be exactly 10 digits." });
      }
    }

    const rawFee = fee !== undefined && fee !== null && fee !== "" ? fee : consultationFee;
    const feeVal = rawFee !== undefined && rawFee !== null && rawFee !== "" ? Number(rawFee) : null;
    const expVal = experience !== undefined && experience !== null && experience !== "" ? Number(experience) : null;
    const ratingVal = rating !== undefined && rating !== null && rating !== "" ? Number(rating) : null;
    const timeVal = availableTime !== undefined && availableTime !== null && availableTime !== "" ? availableTime.trim() : null;
    const photoVal = photo !== undefined && photo !== null && photo !== "" ? photo.trim() : null;
    const daysVal = Array.isArray(availableDays) ? availableDays : null;

    const { rows } = await db.query(
      `UPDATE doctors SET 
       name = COALESCE($1, name),
       email = COALESCE($2, email),
       phone = COALESCE($3, phone),
       specialization = COALESCE($4, specialization),
       department = COALESCE($5, department),
       qualification = COALESCE($6, qualification),
       consultation_fee = COALESCE($7, consultation_fee),
       experience = COALESCE($8, experience),
       rating = COALESCE($9, rating),
       photo = COALESCE($10, photo),
       available_time = COALESCE($11, available_time),
       available_days = COALESCE($12, available_days),
       status = COALESCE($13, status),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $14
       RETURNING *`,
      [
        name ? name.trim() : null,
        email ? email.trim() : null,
        phone ? phone.trim() : null,
        specialization ? specialization.trim() : null,
        department ? department.trim() : null,
        qualification ? qualification.trim() : null,
        feeVal,
        expVal,
        ratingVal,
        photoVal,
        timeVal,
        daysVal,
        status,
        req.params.id,
      ]
    );

    if (!rows.length) return res.status(404).json({ message: "Doctor not found." });
    res.json(mapDoctor(rows[0]));
  } catch (error) {
    res.status(400).json({ message: formatErrorMessage(error) });
  }
};

const deleteDoctor = async (req, res) => {
  try {
    const { rows } = await db.query("DELETE FROM doctors WHERE id = $1 RETURNING *", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Doctor not found." });
    res.json({ message: "Doctor removed." });
  } catch (error) {
    res.status(500).json({ message: formatErrorMessage(error) });
  }
};

module.exports = { getDoctors, getDoctorById, createDoctor, updateDoctor, deleteDoctor, mapDoctor };
