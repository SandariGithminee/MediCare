const db = require("../config/db");

const mapAuditLog = (l) => {
    if (!l) return null;
    return {
        _id: l.id,
        id: l.id,
        user: l.user_name,
        role: l.role,
        action: l.action,
        details: l.details,
        ipAddress: l.ip_address,
        timestamp: l.timestamp,
    };
};

const getAuditLogs = async (req, res) => {
    try {
        const { rows } = await db.query("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100");
        res.json(rows.map(mapAuditLog));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createAuditLog = async (req, res) => {
    try {
        const { user, role, action, details, ipAddress } = req.body;
        const { rows } = await db.query(
            `INSERT INTO audit_logs (user_name, role, action, details, ip_address)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [user || "System", role || "Admin", action, details, ipAddress || "127.0.0.1"]
        );
        res.status(201).json(mapAuditLog(rows[0]));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getAuditLogs, createAuditLog };
