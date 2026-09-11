const db = require("../config/db");

const mapMedicine = (m) => {
    if (!m) return null;
    return {
        _id: m.id,
        id: m.id,
        name: m.name,
        category: m.category,
        manufacturer: m.manufacturer,
        batchNumber: m.batch_number,
        quantityInStock: Number(m.quantity_in_stock || 0),
        minStockLevel: Number(m.min_stock_level || 0),
        unitPrice: Number(m.unit_price || 0),
        expiryDate: m.expiry_date,
        location: m.location,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
    };
};

const getMedicines = async (req, res) => {
    try {
        const search = req.query.search;
        const lowStock = req.query.lowStock === "true";

        let conditions = [];
        let params = [];

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`name ILIKE $${params.length}`);
        }
        if (lowStock) {
            conditions.push(`quantity_in_stock <= min_stock_level`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        const queryText = `SELECT * FROM medicines ${whereClause} ORDER BY name ASC`;

        const { rows } = await db.query(queryText, params);
        res.json(rows.map(mapMedicine));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMedicineById = async (req, res) => {
    try {
        const { rows } = await db.query("SELECT * FROM medicines WHERE id = $1", [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: "Medicine not found" });
        res.json(mapMedicine(rows[0]));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createMedicine = async (req, res) => {
    try {
        const { name, category, manufacturer, batchNumber, quantityInStock, minStockLevel, unitPrice, expiryDate, location } = req.body;

        const { rows } = await db.query(
            `INSERT INTO medicines 
       (name, category, manufacturer, batch_number, quantity_in_stock, min_stock_level, unit_price, expiry_date, location) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
            [
                name,
                category,
                manufacturer,
                batchNumber,
                quantityInStock ? Number(quantityInStock) : 0,
                minStockLevel ? Number(minStockLevel) : 10,
                unitPrice ? Number(unitPrice) : 0,
                expiryDate,
                location || "Main Pharmacy",
            ]
        );

        res.status(201).json(mapMedicine(rows[0]));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateMedicine = async (req, res) => {
    try {
        const { name, category, manufacturer, batchNumber, quantityInStock, minStockLevel, unitPrice, expiryDate, location } = req.body;

        const { rows } = await db.query(
            `UPDATE medicines SET 
       name = COALESCE($1, name),
       category = COALESCE($2, category),
       manufacturer = COALESCE($3, manufacturer),
       batch_number = COALESCE($4, batch_number),
       quantity_in_stock = COALESCE($5, quantity_in_stock),
       min_stock_level = COALESCE($6, min_stock_level),
       unit_price = COALESCE($7, unit_price),
       expiry_date = COALESCE($8, expiry_date),
       location = COALESCE($9, location),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
            [
                name,
                category,
                manufacturer,
                batchNumber,
                quantityInStock !== undefined ? Number(quantityInStock) : null,
                minStockLevel !== undefined ? Number(minStockLevel) : null,
                unitPrice !== undefined ? Number(unitPrice) : null,
                expiryDate,
                location,
                req.params.id,
            ]
        );

        if (!rows.length) return res.status(404).json({ message: "Medicine not found" });
        res.json(mapMedicine(rows[0]));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteMedicine = async (req, res) => {
    try {
        const { rows } = await db.query("DELETE FROM medicines WHERE id = $1 RETURNING *", [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: "Medicine not found" });
        res.json({ message: "Medicine removed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const dispenseMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const qty = Number(quantity);

        const { rows } = await db.query("SELECT * FROM medicines WHERE id = $1", [id]);
        if (!rows.length) return res.status(404).json({ message: "Medicine not found" });

        const med = rows[0];
        if (Number(med.quantity_in_stock) < qty) {
            return res.status(400).json({ message: "Insufficient stock available" });
        }

        const updated = await db.query(
            `UPDATE medicines SET quantity_in_stock = quantity_in_stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            [qty, id]
        );

        res.json({ message: "Medicine dispensed successfully", medicine: mapMedicine(updated.rows[0]) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPrescriptions = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                m.id as record_id, m.patient_id, m.doctor_id, m.appointment_id, m.record_date,
                m.diagnosis, m.prescriptions, m.notes, m.created_at,
                p.first_name as p_first_name, p.last_name as p_last_name, p.phone as p_phone, p.gender as p_gender, p.blood_group as p_blood_group,
                d.name as d_name, d.specialization as d_specialization, d.department as d_department
            FROM medical_records m
            LEFT JOIN patients p ON m.patient_id = p.id
            LEFT JOIN doctors d ON m.doctor_id = d.id
            WHERE m.prescriptions IS NOT NULL 
              AND jsonb_typeof(m.prescriptions) = 'array' 
              AND jsonb_array_length(m.prescriptions) > 0
            ORDER BY m.record_date DESC, m.created_at DESC
        `;
        const { rows: recordRows } = await db.query(queryText);

        // Fetch all current medicines to match availability
        const { rows: medRows } = await db.query(
            "SELECT id, name, category, quantity_in_stock, unit_price, expiry_date, batch_number FROM medicines ORDER BY name ASC"
        );

        const formatted = recordRows.map((r) => {
            const rawPrescriptions = typeof r.prescriptions === "string" ? JSON.parse(r.prescriptions) : r.prescriptions || [];

            const processedPrescriptions = rawPrescriptions.map((rx, index) => {
                const rxName = (rx.medicineName || "").trim().toLowerCase();
                // Find matching medicine in inventory
                const matched = medRows.find((m) => {
                    const mName = m.name.toLowerCase();
                    return mName.includes(rxName) || rxName.includes(mName);
                });

                return {
                    index,
                    medicineName: rx.medicineName || "",
                    dosage: rx.dosage || "",
                    frequency: rx.frequency || "",
                    duration: rx.duration || "",
                    status: rx.status || "Pending",
                    dispensedAt: rx.dispensedAt || null,
                    dispensedBy: rx.dispensedBy || null,
                    dispensedQuantity: rx.dispensedQuantity || null,
                    totalCost: rx.totalCost || null,
                    matchedMedicine: matched
                        ? {
                              id: matched.id,
                              name: matched.name,
                              category: matched.category,
                              quantityInStock: Number(matched.quantity_in_stock),
                              unitPrice: Number(matched.unit_price),
                              expiryDate: matched.expiry_date,
                              batchNumber: matched.batch_number,
                              isAvailable: Number(matched.quantity_in_stock) > 0,
                          }
                        : null,
                };
            });

            const pendingCount = processedPrescriptions.filter((p) => p.status !== "Dispensed").length;

            return {
                id: r.record_id,
                recordId: r.record_id,
                recordDate: r.record_date,
                diagnosis: r.diagnosis,
                notes: r.notes,
                patient: {
                    id: r.patient_id,
                    _id: r.patient_id,
                    firstName: r.p_first_name || "Unknown",
                    lastName: r.p_last_name || "Patient",
                    phone: r.p_phone || "",
                    gender: r.p_gender || "",
                    bloodGroup: r.p_blood_group || "",
                },
                doctor: {
                    id: r.doctor_id,
                    _id: r.doctor_id,
                    name: r.d_name || "Attending Physician",
                    specialization: r.d_specialization || "",
                    department: r.d_department || "",
                },
                prescriptions: processedPrescriptions,
                pendingCount,
                status: pendingCount === 0 ? "Dispensed" : "Pending",
                createdAt: r.created_at,
            };
        });

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const dispensePrescription = async (req, res) => {
    try {
        const { recordId } = req.params;
        const { prescriptionIndex, medicineId, quantity, createBill = true } = req.body;
        const qty = Number(quantity);

        if (!qty || qty <= 0) {
            return res.status(400).json({ message: "Valid dispense quantity is required" });
        }

        // Get medical record
        const { rows: recRows } = await db.query("SELECT * FROM medical_records WHERE id = $1", [recordId]);
        if (!recRows.length) return res.status(404).json({ message: "Medical record not found" });

        const record = recRows[0];
        const rawPrescriptions = typeof record.prescriptions === "string" ? JSON.parse(record.prescriptions) : record.prescriptions || [];

        const targetIdx = Number(prescriptionIndex);
        if (targetIdx < 0 || targetIdx >= rawPrescriptions.length) {
            return res.status(400).json({ message: "Invalid prescription item selected" });
        }

        const targetRx = rawPrescriptions[targetIdx];
        if (targetRx.status === "Dispensed") {
            return res.status(400).json({ message: "This prescription item has already been dispensed" });
        }

        // Check medicine
        const { rows: medRows } = await db.query("SELECT * FROM medicines WHERE id = $1", [medicineId]);
        if (!medRows.length) {
            return res.status(404).json({ message: "Medicine not found in inventory" });
        }

        const med = medRows[0];
        if (Number(med.quantity_in_stock) < qty) {
            return res.status(400).json({
                message: `Insufficient stock for ${med.name}. Available: ${med.quantity_in_stock}, Requested: ${qty}`,
            });
        }

        // Deduct inventory
        const updatedMed = await db.query(
            "UPDATE medicines SET quantity_in_stock = quantity_in_stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [qty, medicineId]
        );

        const totalCost = Number((qty * Number(med.unit_price || 0)).toFixed(2));

        // Update prescription item in array
        rawPrescriptions[targetIdx] = {
            ...targetRx,
            status: "Dispensed",
            dispensedAt: new Date().toISOString(),
            dispensedBy: req.user?.name || "Pharmacist",
            dispensedQuantity: qty,
            medicineId: med.id,
            medicineNameUsed: med.name,
            unitPrice: Number(med.unit_price || 0),
            totalCost: totalCost,
        };

        await db.query("UPDATE medical_records SET prescriptions = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
            JSON.stringify(rawPrescriptions),
            recordId,
        ]);

        // Auto create billing invoice if requested
        let invoice = null;
        if (createBill && totalCost > 0) {
            const invoiceNumber = `INV-PHARM-${Date.now().toString().slice(-6)}`;
            const billItems = [
                {
                    description: `Pharmacy: ${med.name} (${qty} units)`,
                    quantity: qty,
                    unitPrice: Number(med.unit_price || 0),
                    amount: totalCost,
                },
            ];

            const { rows: billRows } = await db.query(
                `INSERT INTO billing (invoice_number, patient_id, items, total_amount, paid_amount, status, payment_method, date)
                 VALUES ($1, $2, $3, $4, 0, 'Pending', 'Cash', CURRENT_TIMESTAMP)
                 RETURNING *`,
                [invoiceNumber, record.patient_id, JSON.stringify(billItems), totalCost]
            );
            invoice = billRows[0];
        }

        res.json({
            message: `Successfully dispensed ${qty} units of ${med.name}`,
            prescription: rawPrescriptions[targetIdx],
            medicine: mapMedicine(updatedMed.rows[0]),
            invoice,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMedicines,
    getMedicineById,
    createMedicine,
    updateMedicine,
    deleteMedicine,
    dispenseMedicine,
    getPrescriptions,
    dispensePrescription,
};
