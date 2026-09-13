const db = require("../config/db");

const buildBillingQuery = (whereClause = "", params = []) => {
  return {
    text: `
      SELECT 
        b.id, b.invoice_number, b.patient_id, b.items, b.total_amount, b.paid_amount, b.status, b.payment_method, b.date, b.created_at, b.updated_at,
        p.first_name as p_first_name, p.last_name as p_last_name, p.phone as p_phone
      FROM billing b
      LEFT JOIN patients p ON b.patient_id = p.id
      ${whereClause}
      ORDER BY b.created_at DESC
    `,
    params,
  };
};

const mapBilling = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    invoiceNumber: row.invoice_number,
    patient: {
      _id: row.patient_id,
      id: row.patient_id,
      firstName: row.p_first_name || "Unknown",
      lastName: row.p_last_name || "Patient",
      phone: row.p_phone || "",
    },
    items: typeof row.items === "string" ? JSON.parse(row.items) : row.items || [],
    totalAmount: Number(row.total_amount || 0),
    paidAmount: Number(row.paid_amount || 0),
    status: row.status,
    paymentMethod: row.payment_method,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const getBillings = async (req, res) => {
  try {
    const conditions = [];
    const params = [];

    if (req.query.status) {
      params.push(req.query.status);
      conditions.push(`b.status = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const q = buildBillingQuery(whereClause, params);
    const { rows } = await db.query(q.text, q.params);
    res.json(rows.map(mapBilling));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBillingById = async (req, res) => {
  try {
    const q = buildBillingQuery("WHERE b.id = $1", [req.params.id]);
    const { rows } = await db.query(q.text, q.params);
    if (!rows.length) return res.status(404).json({ message: "Invoice not found" });
    res.json(mapBilling(rows[0]));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBilling = async (req, res) => {
  try {
    const countResult = await db.query("SELECT COUNT(*) FROM billing");
    const count = Number(countResult?.rows?.[0]?.count || 0);
    const invoiceNumber = req.body.invoiceNumber || `INV-${String(count + 1001).padStart(5, "0")}`;

    const { patient, patientId, items, totalAmount, paidAmount, status, paymentMethod, date } = req.body;
    const pId = patientId || (typeof patient === "object" ? patient?._id || patient?.id : patient);

    const insertResult = await db.query(
      `INSERT INTO billing (invoice_number, patient_id, items, total_amount, paid_amount, status, payment_method, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        invoiceNumber,
        pId,
        JSON.stringify(items || []),
        totalAmount ? Number(totalAmount) : 0,
        paidAmount ? Number(paidAmount) : 0,
        status || "Pending",
        paymentMethod || "Cash",
        date || new Date(),
      ]
    );

    const newId = insertResult.rows[0].id;
    const q = buildBillingQuery("WHERE b.id = $1", [newId]);
    const { rows } = await db.query(q.text, q.params);
    res.status(201).json(mapBilling(rows[0]));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateBilling = async (req, res) => {
  try {
    const { patient, patientId, items, totalAmount, paidAmount, status, paymentMethod, date } = req.body;
    const pId = patientId || (typeof patient === "object" ? patient?._id || patient?.id : patient);

    await db.query(
      `UPDATE billing SET
       patient_id = COALESCE($1, patient_id),
       items = COALESCE($2, items),
       total_amount = COALESCE($3, total_amount),
       paid_amount = COALESCE($4, paid_amount),
       status = COALESCE($5, status),
       payment_method = COALESCE($6, payment_method),
       date = COALESCE($7, date),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [
        pId,
        items ? JSON.stringify(items) : null,
        totalAmount !== undefined ? Number(totalAmount) : null,
        paidAmount !== undefined ? Number(paidAmount) : null,
        status,
        paymentMethod,
        date,
        req.params.id,
      ]
    );

    const q = buildBillingQuery("WHERE b.id = $1", [req.params.id]);
    const { rows } = await db.query(q.text, q.params);
    if (!rows.length) return res.status(404).json({ message: "Invoice not found" });
    res.json(mapBilling(rows[0]));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteBilling = async (req, res) => {
  try {
    const { rows } = await db.query("DELETE FROM billing WHERE id = $1 RETURNING *", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Invoice not found" });
    res.json({ message: "Invoice removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBillings, getBillingById, createBilling, updateBilling, deleteBilling };
