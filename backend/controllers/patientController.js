const db = require("../config/db");
const { formatErrorMessage } = require("../utils/errorHandler");

const calculateAgeFromDob = (dobStr) => {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
};

const validatePatientInput = (data, isUpdate = false) => {
  const errors = {};

  if (!isUpdate || data.firstName !== undefined) {
    if (!data.firstName || typeof data.firstName !== "string" || data.firstName.trim().length < 2) {
      errors.firstName = "First name is required (at least 2 characters).";
    }
  }

  if (!isUpdate || data.lastName !== undefined) {
    if (!data.lastName || typeof data.lastName !== "string" || data.lastName.trim().length < 2) {
      errors.lastName = "Last name is required (at least 2 characters).";
    }
  }

  if (!isUpdate || data.phone !== undefined) {
    const rawDigits = (data.phone || "").replace(/[^0-9]/g, "");
    if (!data.phone || rawDigits.length < 7) {
      errors.phone = "A valid phone number with at least 7 digits is required.";
    }
  }

  if (data.email && data.email.trim() !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
  }

  let computedAge = null;
  if (data.dateOfBirth) {
    const dob = new Date(data.dateOfBirth);
    if (isNaN(dob.getTime())) {
      errors.dateOfBirth = "Please enter a valid date of birth.";
    } else if (dob > new Date()) {
      errors.dateOfBirth = "Date of birth cannot be in the future.";
    } else {
      computedAge = calculateAgeFromDob(data.dateOfBirth);
    }
  }

  if (data.age !== undefined && data.age !== null && data.age !== "") {
    const numAge = Number(data.age);
    if (isNaN(numAge) || !Number.isInteger(numAge) || numAge < 0 || numAge > 130) {
      errors.age = "Age must be a whole number between 0 and 130.";
    } else {
      computedAge = numAge;
    }
  }

  if (!isUpdate && computedAge === null && !errors.age && !errors.dateOfBirth) {
    errors.age = "Please provide either a Date of Birth or an Age.";
  }

  const isValid = Object.keys(errors).length === 0;
  return {
    isValid,
    errors,
    message: Object.values(errors)[0] || null,
    computedAge,
  };
};

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
    dateOfBirth: p.date_of_birth
      ? (p.date_of_birth instanceof Date
          ? p.date_of_birth.toISOString().split("T")[0]
          : String(p.date_of_birth).split("T")[0])
      : null,
    gender: p.gender,
    address: p.address,
    bloodGroup: p.blood_group,
    medicalHistory: p.medical_history,
    emergencyContact: p.emergency_contact,
    photo: p.photo,
    documents: p.documents || [],
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
    res.status(500).json({ message: formatErrorMessage(error) });
  }
};

const getPatientById = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM patients WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Patient not found." });
    res.json(mapPatient(rows[0]));
  } catch (error) {
    res.status(500).json({ message: formatErrorMessage(error) });
  }
};

const createPatient = async (req, res) => {
  try {
    const validation = validatePatientInput(req.body, false);
    if (!validation.isValid) {
      return res.status(400).json({
        message: validation.message,
        errors: validation.errors,
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      bloodGroup,
      medicalHistory,
      emergencyContact,
      photo,
      status,
    } = req.body;

    const { rows } = await db.query(
      `INSERT INTO patients 
       (first_name, last_name, email, phone, age, date_of_birth, gender, address, blood_group, medical_history, emergency_contact, photo, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [
        firstName.trim(),
        lastName.trim(),
        email ? email.trim() : null,
        phone.trim(),
        validation.computedAge,
        dateOfBirth || null,
        gender || "Male",
        address ? address.trim() : null,
        bloodGroup || null,
        medicalHistory ? medicalHistory.trim() : null,
        emergencyContact ? emergencyContact.trim() : null,
        photo || null,
        status || "Active",
      ]
    );

    res.status(201).json(mapPatient(rows[0]));
  } catch (error) {
    res.status(400).json({ message: formatErrorMessage(error) });
  }
};

const updatePatient = async (req, res) => {
  try {
    const validation = validatePatientInput(req.body, true);
    if (!validation.isValid) {
      return res.status(400).json({
        message: validation.message,
        errors: validation.errors,
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      bloodGroup,
      medicalHistory,
      emergencyContact,
      photo,
      status,
    } = req.body;

    const { rows } = await db.query(
      `UPDATE patients SET 
       first_name = COALESCE($1, first_name),
       last_name = COALESCE($2, last_name),
       email = COALESCE($3, email),
       phone = COALESCE($4, phone),
       age = COALESCE($5, age),
       date_of_birth = COALESCE($6, date_of_birth),
       gender = COALESCE($7, gender),
       address = COALESCE($8, address),
       blood_group = COALESCE($9, blood_group),
       medical_history = COALESCE($10, medical_history),
       emergency_contact = COALESCE($11, emergency_contact),
       photo = COALESCE($12, photo),
       status = COALESCE($13, status),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $14
       RETURNING *`,
      [
        firstName ? firstName.trim() : null,
        lastName ? lastName.trim() : null,
        email ? email.trim() : null,
        phone ? phone.trim() : null,
        validation.computedAge,
        dateOfBirth || null,
        gender || null,
        address ? address.trim() : null,
        bloodGroup || null,
        medicalHistory ? medicalHistory.trim() : null,
        emergencyContact ? emergencyContact.trim() : null,
        photo || null,
        status || null,
        req.params.id,
      ]
    );

    if (!rows.length) return res.status(404).json({ message: "Patient not found." });
    res.json(mapPatient(rows[0]));
  } catch (error) {
    res.status(400).json({ message: formatErrorMessage(error) });
  }
};

const deletePatient = async (req, res) => {
  try {
    const { rows } = await db.query("DELETE FROM patients WHERE id = $1 RETURNING *", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Patient not found." });
    res.json({ message: "Patient successfully removed." });
  } catch (error) {
    res.status(500).json({ message: formatErrorMessage(error) });
  }
};

module.exports = { getPatients, getPatientById, createPatient, updatePatient, deletePatient, mapPatient };
