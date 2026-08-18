const db = require("../config/db");

const buildMedicalRecordQuery = (whereClause = "", params = []) => {
    return {
        text: `
      SELECT 
        m.id, m.patient_id, m.doctor_id, m.appointment_id, m.record_date, m.diagnosis, m.symptoms, m.vitals, m.prescriptions, m.treatment_plan, m.notes, m.created_at, m.updated_at,
        p.first_name as p_first_name, p.last_name as p_last_name, p.phone as p_phone, p.gender as p_gender, p.blood_group as p_blood_group,
        d.name as d_name, d.specialization as d_specialization, d.department as d_department
      FROM medical_records m
      LEFT JOIN patients p ON m.patient_id = p.id
      LEFT JOIN doctors d ON m.doctor_id = d.id
      ${whereClause}
      ORDER BY m.record_date DESC, m.created_at DESC
    `,
        params,
    };
};

const mapMedicalRecord = (row) => {
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
            gender: row.p_gender || "",
            bloodGroup: row.p_blood_group || "",
        },
        doctor: {
            _id: row.doctor_id,
            id: row.doctor_id,
            name: row.d_name || "Attending Physician",
            specialization: row.d_specialization || "",
            department: row.d_department || "",
        },
        appointment: row.appointment_id,
        recordDate: row.record_date,
        date: row.record_date,
        diagnosis: row.diagnosis,
        symptoms: row.symptoms,
        vitals: typeof row.vitals === "string" ? JSON.parse(row.vitals) : row.vitals || {},
        prescriptions: typeof row.prescriptions === "string" ? JSON.parse(row.prescriptions) : row.prescriptions || [],
        treatmentPlan: row.treatment_plan,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
};

const getMedicalRecords = async (req, res) => {
    try {
        const conditions = [];
        const params = [];

        if (req.query.patient) {
            params.push(req.query.patient);
            conditions.push(`m.patient_id = $${params.length}`);
        }
        if (req.query.doctor) {
            params.push(req.query.doctor);
            conditions.push(`m.doctor_id = $${params.length}`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        const q = buildMedicalRecordQuery(whereClause, params);
        const { rows } = await db.query(q.text, q.params);
        res.json(rows.map(mapMedicalRecord));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMedicalRecordById = async (req, res) => {
    try {
        const q = buildMedicalRecordQuery("WHERE m.id = $1", [req.params.id]);
        const { rows } = await db.query(q.text, q.params);
        if (!rows.length) return res.status(404).json({ message: "Medical record not found" });
        res.json(mapMedicalRecord(rows[0]));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createMedicalRecord = async (req, res) => {
    try {
        const { patient, doctor, appointment, patientId, doctorId, appointmentId, recordDate, date, diagnosis, symptoms, vitals, prescriptions, treatmentPlan, notes } = req.body;
        const pId = patientId || (typeof patient === "object" ? patient?._id || patient?.id : patient);
        const dId = doctorId || (typeof doctor === "object" ? doctor?._id || doctor?.id : doctor);
        const aId = appointmentId || (typeof appointment === "object" ? appointment?._id || appointment?.id : appointment);
        const rDate = recordDate || date || new Date().toISOString().split("T")[0];

        const insertResult = await db.query(
            `INSERT INTO medical_records 
       (patient_id, doctor_id, appointment_id, record_date, diagnosis, symptoms, vitals, prescriptions, treatment_plan, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [
                pId,
                dId,
                aId || null,
                rDate,
                diagnosis,
                symptoms,
                JSON.stringify(vitals || {}),
                JSON.stringify(prescriptions || []),
                treatmentPlan,
                notes,
            ]
        );

        const newId = insertResult.rows[0].id;
        const q = buildMedicalRecordQuery("WHERE m.id = $1", [newId]);
        const { rows } = await db.query(q.text, q.params);
        res.status(201).json(mapMedicalRecord(rows[0]));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateMedicalRecord = async (req, res) => {
    try {
        const { patient, doctor, appointment, patientId, doctorId, appointmentId, recordDate, date, diagnosis, symptoms, vitals, prescriptions, treatmentPlan, notes } = req.body;
        const pId = patientId || (typeof patient === "object" ? patient?._id || patient?.id : patient);
        const dId = doctorId || (typeof doctor === "object" ? doctor?._id || doctor?.id : doctor);
        const aId = appointmentId || (typeof appointment === "object" ? appointment?._id || appointment?.id : appointment);
        const rDate = recordDate || date;

        await db.query(
            `UPDATE medical_records SET
       patient_id = COALESCE($1, patient_id),
       doctor_id = COALESCE($2, doctor_id),
       appointment_id = COALESCE($3, appointment_id),
       record_date = COALESCE($4, record_date),
       diagnosis = COALESCE($5, diagnosis),
       symptoms = COALESCE($6, symptoms),
       vitals = COALESCE($7, vitals),
       prescriptions = COALESCE($8, prescriptions),
       treatment_plan = COALESCE($9, treatment_plan),
       notes = COALESCE($10, notes),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $11`,
            [
                pId,
                dId,
                aId,
                rDate,
                diagnosis,
                symptoms,
                vitals ? JSON.stringify(vitals) : null,
                prescriptions ? JSON.stringify(prescriptions) : null,
                treatmentPlan,
                notes,
                req.params.id,
            ]
        );

        const q = buildMedicalRecordQuery("WHERE m.id = $1", [req.params.id]);
        const { rows } = await db.query(q.text, q.params);
        if (!rows.length) return res.status(404).json({ message: "Medical record not found" });
        res.json(mapMedicalRecord(rows[0]));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteMedicalRecord = async (req, res) => {
    try {
        const { rows } = await db.query("DELETE FROM medical_records WHERE id = $1 RETURNING *", [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: "Medical record not found" });
        res.json({ message: "Medical record deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMedicalRecords,
    getMedicalRecordById,
    createMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,
};
