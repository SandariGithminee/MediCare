const db = require("../config/db");

const buildAdmissionQuery = (whereClause = "", params = []) => {
    return {
        text: `
      SELECT 
        a.id, a.patient_id, a.doctor_id, a.room_number, a.bed_number, a.admission_date, a.discharge_date, a.status, a.reason, a.daily_rate, a.notes, a.created_at, a.updated_at,
        p.first_name as p_first_name, p.last_name as p_last_name, p.phone as p_phone, p.gender as p_gender, p.blood_group as p_blood_group,
        d.name as d_name, d.specialization as d_specialization, d.department as d_department
      FROM admissions a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      ${whereClause}
      ORDER BY a.admission_date DESC, a.created_at DESC
    `,
        params,
    };
};

const mapAdmission = (row) => {
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
            name: row.d_name || "Attending Doctor",
            specialization: row.d_specialization || "",
            department: row.d_department || "",
        },
        roomNumber: row.room_number,
        bedNumber: row.bed_number,
        admissionDate: row.admission_date,
        dischargeDate: row.discharge_date,
        status: row.status,
        reason: row.reason,
        dailyRate: Number(row.daily_rate || 0),
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
};

const getAdmissions = async (req, res) => {
    try {
        const conditions = [];
        const params = [];

        if (req.query.status) {
            params.push(req.query.status);
            conditions.push(`a.status = $${params.length}`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        const q = buildAdmissionQuery(whereClause, params);
        const { rows } = await db.query(q.text, q.params);
        res.json(rows.map(mapAdmission));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAdmissionById = async (req, res) => {
    try {
        const q = buildAdmissionQuery("WHERE a.id = $1", [req.params.id]);
        const { rows } = await db.query(q.text, q.params);
        if (!rows.length) return res.status(404).json({ message: "Admission record not found" });
        res.json(mapAdmission(rows[0]));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createAdmission = async (req, res) => {
    try {
        const { patient, doctor, patientId, doctorId, roomNumber, bedNumber, admissionDate, dischargeDate, status, reason, dailyRate, notes } = req.body;
        const pId = patientId || (typeof patient === "object" ? patient?._id || patient?.id : patient);
        const dId = doctorId || (typeof doctor === "object" ? doctor?._id || doctor?.id : doctor);

        const insertResult = await db.query(
            `INSERT INTO admissions (patient_id, doctor_id, room_number, bed_number, admission_date, discharge_date, status, reason, daily_rate, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [pId, dId, roomNumber, bedNumber, admissionDate || new Date(), dischargeDate || null, status || "Admitted", reason, dailyRate ? Number(dailyRate) : 0, notes]
        );

        // Update patient status to Admitted
        await db.query("UPDATE patients SET status = 'Admitted' WHERE id = $1", [pId]);

        const newId = insertResult.rows[0].id;
        const q = buildAdmissionQuery("WHERE a.id = $1", [newId]);
        const { rows } = await db.query(q.text, q.params);
        res.status(201).json(mapAdmission(rows[0]));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateAdmission = async (req, res) => {
    try {
        const { patient, doctor, patientId, doctorId, roomNumber, bedNumber, admissionDate, dischargeDate, status, reason, dailyRate, notes } = req.body;
        const pId = patientId || (typeof patient === "object" ? patient?._id || patient?.id : patient);
        const dId = doctorId || (typeof doctor === "object" ? doctor?._id || doctor?.id : doctor);
        let disDate = dischargeDate;

        if (status === "Discharged" && !disDate) {
            disDate = new Date();
        }

        await db.query(
            `UPDATE admissions SET
       patient_id = COALESCE($1, patient_id),
       doctor_id = COALESCE($2, doctor_id),
       room_number = COALESCE($3, room_number),
       bed_number = COALESCE($4, bed_number),
       admission_date = COALESCE($5, admission_date),
       discharge_date = COALESCE($6, discharge_date),
       status = COALESCE($7, status),
       reason = COALESCE($8, reason),
       daily_rate = COALESCE($9, daily_rate),
       notes = COALESCE($10, notes),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $11`,
            [
                pId,
                dId,
                roomNumber,
                bedNumber,
                admissionDate,
                disDate,
                status,
                reason,
                dailyRate ? Number(dailyRate) : null,
                notes,
                req.params.id,
            ]
        );

        if (status === "Discharged" && pId) {
            await db.query("UPDATE patients SET status = 'Discharged' WHERE id = $1", [pId]);
        }

        const q = buildAdmissionQuery("WHERE a.id = $1", [req.params.id]);
        const { rows } = await db.query(q.text, q.params);
        if (!rows.length) return res.status(404).json({ message: "Admission record not found" });
        res.json(mapAdmission(rows[0]));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteAdmission = async (req, res) => {
    try {
        const { rows } = await db.query("DELETE FROM admissions WHERE id = $1 RETURNING *", [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: "Admission record not found" });
        res.json({ message: "Admission record removed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAdmissions,
    getAdmissionById,
    createAdmission,
    updateAdmission,
    deleteAdmission,
};
