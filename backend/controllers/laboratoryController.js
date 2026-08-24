const db = require("../config/db");

const buildLabQuery = (whereClause = "", params = []) => {
    return {
        text: `
      SELECT 
        l.id, l.patient_id, l.doctor_id, l.test_name, l.test_category, l.sample_details, l.result_value, l.normal_range, l.unit, l.status, l.requested_date, l.completed_at, l.technician_notes, l.cost, l.documents, l.created_at, l.updated_at,
        p.first_name as p_first_name, p.last_name as p_last_name, p.phone as p_phone, p.gender as p_gender,
        d.name as d_name, d.specialization as d_specialization
      FROM laboratory l
      LEFT JOIN patients p ON l.patient_id = p.id
      LEFT JOIN doctors d ON l.doctor_id = d.id
      ${whereClause}
      ORDER BY l.requested_date DESC, l.created_at DESC
    `,
        params,
    };
};

const mapLabTest = (row) => {
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
        },
        doctor: {
            _id: row.doctor_id,
            id: row.doctor_id,
            name: row.d_name || "Ordering Physician",
            specialization: row.d_specialization || "",
        },
        testName: row.test_name,
        testCategory: row.test_category,
        sampleDetails: row.sample_details,
        resultValue: row.result_value,
        normalRange: row.normal_range,
        unit: row.unit,
        status: row.status,
        requestedDate: row.requested_date,
        completedAt: row.completed_at,
        technicianNotes: row.technician_notes,
        cost: Number(row.cost || 0),
        documents: typeof row.documents === "string" ? JSON.parse(row.documents) : row.documents || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
};

const getLabTests = async (req, res) => {
    try {
        const conditions = [];
        const params = [];

        if (req.query.status) {
            params.push(req.query.status);
            conditions.push(`l.status = $${params.length}`);
        }
        if (req.query.patient) {
            params.push(req.query.patient);
            conditions.push(`l.patient_id = $${params.length}`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        const q = buildLabQuery(whereClause, params);
        const { rows } = await db.query(q.text, q.params);
        res.json(rows.map(mapLabTest));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLabTestById = async (req, res) => {
    try {
        const q = buildLabQuery("WHERE l.id = $1", [req.params.id]);
        const { rows } = await db.query(q.text, q.params);
        if (!rows.length) return res.status(404).json({ message: "Lab test not found" });
        res.json(mapLabTest(rows[0]));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createLabTest = async (req, res) => {
    try {
        const { patient, doctor, patientId, doctorId, testName, testCategory, sampleDetails, resultValue, normalRange, unit, status, technicianNotes, cost, documents } = req.body;
        const pId = patientId || (typeof patient === "object" ? patient?._id || patient?.id : patient);
        const dId = doctorId || (typeof doctor === "object" ? doctor?._id || doctor?.id : doctor);

        const insertResult = await db.query(
            `INSERT INTO laboratory (patient_id, doctor_id, test_name, test_category, sample_details, result_value, normal_range, unit, status, technician_notes, cost, documents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
            [pId, dId, testName, testCategory, sampleDetails, resultValue, normalRange, unit, status || "Requested", technicianNotes, cost ? Number(cost) : 0, JSON.stringify(documents || [])]
        );

        const newId = insertResult.rows[0].id;
        const q = buildLabQuery("WHERE l.id = $1", [newId]);
        const { rows } = await db.query(q.text, q.params);
        res.status(201).json(mapLabTest(rows[0]));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateLabTest = async (req, res) => {
    try {
        const { patient, doctor, patientId, doctorId, testName, testCategory, sampleDetails, resultValue, normalRange, unit, status, technicianNotes, cost, completedAt, documents } = req.body;
        const pId = patientId || (typeof patient === "object" ? patient?._id || patient?.id : patient);
        const dId = doctorId || (typeof doctor === "object" ? doctor?._id || doctor?.id : doctor);
        let compAt = completedAt;

        if (status === "Completed" && !compAt) {
            compAt = new Date();
        }

        await db.query(
            `UPDATE laboratory SET
       patient_id = COALESCE($1, patient_id),
       doctor_id = COALESCE($2, doctor_id),
       test_name = COALESCE($3, test_name),
       test_category = COALESCE($4, test_category),
       sample_details = COALESCE($5, sample_details),
       result_value = COALESCE($6, result_value),
       normal_range = COALESCE($7, normal_range),
       unit = COALESCE($8, unit),
       status = COALESCE($9, status),
       completed_at = COALESCE($10, completed_at),
       technician_notes = COALESCE($11, technician_notes),
       cost = COALESCE($12, cost),
       documents = COALESCE($13, documents),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $14`,
            [
                pId,
                dId,
                testName,
                testCategory,
                sampleDetails,
                resultValue,
                normalRange,
                unit,
                status,
                compAt,
                technicianNotes,
                cost ? Number(cost) : null,
                documents ? JSON.stringify(documents) : null,
                req.params.id,
            ]
        );

        const q = buildLabQuery("WHERE l.id = $1", [req.params.id]);
        const { rows } = await db.query(q.text, q.params);
        if (!rows.length) return res.status(404).json({ message: "Lab test not found" });
        res.json(mapLabTest(rows[0]));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteLabTest = async (req, res) => {
    try {
        const { rows } = await db.query("DELETE FROM laboratory WHERE id = $1 RETURNING *", [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: "Lab test not found" });
        res.json({ message: "Lab test removed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getLabTests,
    getLabTestById,
    createLabTest,
    updateLabTest,
    deleteLabTest,
};
