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

module.exports = {
    getMedicines,
    getMedicineById,
    createMedicine,
    updateMedicine,
    deleteMedicine,
    dispenseMedicine,
};
