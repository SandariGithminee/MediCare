const db = require("../config/db");

const buildAppointmentQuery = (whereClause = "", params = []) => {
  return {
    text: `
      SELECT 
        a.id, a.patient_id, a.doctor_id, a.appointment_date, a.appointment_time, a.status, a.reason, a.notes, a.created_at, a.updated_at,
        p.first_name as p_first_name, p.last_name as p_last_name, p.phone as p_phone,
        d.name as d_name, d.specialization as d_specialization, d.department as d_department
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      ${whereClause}
      ORDER BY a.appointment_date DESC, a.created_at DESC
    `,
    params,
  };
};

const mapAppointment = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    patient: {
      _id: row.patient_id,
      id: row.patient_id,
      firstName: row.p_first_name || "Unknown",
      lastName: row.p_last_name || "Patient",
      phone: row.p_phone || "",
    },
    doctor: {
      _id: row.doctor_id,
      id: row.doctor_id,
      name: row.d_name || "Unassigned Doctor",
      specialization: row.d_specialization || "",
      department: row.d_department || "",
    },
    date: row.appointment_date,
    appointmentDate: row.appointment_date,
    time: row.appointment_time,
    appointmentTime: row.appointment_time,
    status: row.status,
    reason: row.reason,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const getAppointments = async (req, res) => {
  try {
    const conditions = [];
    const params = [];

    if (req.query.status) {
      params.push(req.query.status);
      conditions.push(`a.status = $${params.length}`);
    }
    if (req.query.doctor) {
      params.push(req.query.doctor);
      conditions.push(`a.doctor_id = $${params.length}`);
    }
    if (req.query.patient) {
      params.push(req.query.patient);
      conditions.push(`a.patient_id = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const q = buildAppointmentQuery(whereClause, params);
    const { rows } = await db.query(q.text, q.params);
    res.json(rows.map(mapAppointment));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const q = buildAppointmentQuery("WHERE a.id = $1", [req.params.id]);
    const { rows } = await db.query(q.text, q.params);
    if (!rows.length) return res.status(404).json({ message: "Appointment not found" });
    res.json(mapAppointment(rows[0]));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createAppointment = async (req, res) => {
  try {
    const { patient, doctor, patientId, doctorId, date, time, appointmentDate, appointmentTime, status, reason, notes } = req.body;
    const pId = patientId || (typeof patient === "object" ? patient?._id || patient?.id : patient);
    const dId = doctorId || (typeof doctor === "object" ? doctor?._id || doctor?.id : doctor);
    const apptDate = date || appointmentDate;
    const apptTime = time || appointmentTime;

    const insertResult = await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, reason, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [pId, dId, apptDate, apptTime, status || "Pending", reason, notes]
    );

    const newId = insertResult.rows[0].id;
    const q = buildAppointmentQuery("WHERE a.id = $1", [newId]);
    const { rows } = await db.query(q.text, q.params);
    res.status(201).json(mapAppointment(rows[0]));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const { patient, doctor, patientId, doctorId, date, time, appointmentDate, appointmentTime, status, reason, notes } = req.body;
    const pId = patientId || (typeof patient === "object" ? patient?._id || patient?.id : patient);
    const dId = doctorId || (typeof doctor === "object" ? doctor?._id || doctor?.id : doctor);
    const apptDate = date || appointmentDate;
    const apptTime = time || appointmentTime;

    await db.query(
      `UPDATE appointments SET
       patient_id = COALESCE($1, patient_id),
       doctor_id = COALESCE($2, doctor_id),
       appointment_date = COALESCE($3, appointment_date),
       appointment_time = COALESCE($4, appointment_time),
       status = COALESCE($5, status),
       reason = COALESCE($6, reason),
       notes = COALESCE($7, notes),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [pId, dId, apptDate, apptTime, status, reason, notes, req.params.id]
    );

    const q = buildAppointmentQuery("WHERE a.id = $1", [req.params.id]);
    const { rows } = await db.query(q.text, q.params);
    if (!rows.length) return res.status(404).json({ message: "Appointment not found" });
    res.json(mapAppointment(rows[0]));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const { rows } = await db.query("DELETE FROM appointments WHERE id = $1 RETURNING *", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};
