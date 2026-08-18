const db = require("../config/db");

const mapStaff = (s) => {
    if (!s) return null;
    return {
        _id: s.id,
        id: s.id,
        employeeId: s.employee_id,
        name: s.name,
        role: s.role,
        department: s.department,
        email: s.email,
        phone: s.phone,
        salary: Number(s.salary || 0),
        joinDate: s.join_date,
        status: s.status,
        attendance: typeof s.attendance === "string" ? JSON.parse(s.attendance) : s.attendance || [],
        createdAt: s.created_at,
        updatedAt: s.updated_at,
    };
};

const getStaff = async (req, res) => {
    try {
        const search = req.query.search;
        let queryText = "SELECT * FROM staff ORDER BY employee_id ASC";
        let params = [];

        if (search) {
            queryText = `
        SELECT * FROM staff 
        WHERE name ILIKE $1 OR employee_id ILIKE $1 OR department ILIKE $1 
        ORDER BY employee_id ASC
      `;
            params = [`%${search}%`];
        }

        const { rows } = await db.query(queryText, params);
        res.json(rows.map(mapStaff));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getStaffById = async (req, res) => {
    try {
        const { rows } = await db.query("SELECT * FROM staff WHERE id = $1", [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: "Staff member not found" });
        res.json(mapStaff(rows[0]));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createStaff = async (req, res) => {
    try {
        const { countResult } = await db.query("SELECT COUNT(*) FROM staff");
        const count = Number(countResult?.rows?.[0]?.count || 0);
        const employeeId = req.body.employeeId || `EMP-${String(count + 101).padStart(4, "0")}`;
        const { name, role, department, email, phone, salary, joinDate, status } = req.body;

        const { rows } = await db.query(
            `INSERT INTO staff 
       (employee_id, name, role, department, email, phone, salary, join_date, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
            [
                employeeId,
                name,
                role,
                department,
                email,
                phone,
                salary ? Number(salary) : 0,
                joinDate || new Date().toISOString().split("T")[0],
                status || "Active",
            ]
        );

        res.status(201).json(mapStaff(rows[0]));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateStaff = async (req, res) => {
    try {
        const { employeeId, name, role, department, email, phone, salary, joinDate, status } = req.body;

        const { rows } = await db.query(
            `UPDATE staff SET 
       employee_id = COALESCE($1, employee_id),
       name = COALESCE($2, name),
       role = COALESCE($3, role),
       department = COALESCE($4, department),
       email = COALESCE($5, email),
       phone = COALESCE($6, phone),
       salary = COALESCE($7, salary),
       join_date = COALESCE($8, join_date),
       status = COALESCE($9, status),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
            [
                employeeId,
                name,
                role,
                department,
                email,
                phone,
                salary !== undefined ? Number(salary) : null,
                joinDate,
                status,
                req.params.id,
            ]
        );

        if (!rows.length) return res.status(404).json({ message: "Staff member not found" });
        res.json(mapStaff(rows[0]));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteStaff = async (req, res) => {
    try {
        const { rows } = await db.query("DELETE FROM staff WHERE id = $1 RETURNING *", [req.params.id]);
        if (!rows.length) return res.status(404).json({ message: "Staff member not found" });
        res.json({ message: "Staff member deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const recordAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, date } = req.body;
        const { rows } = await db.query("SELECT * FROM staff WHERE id = $1", [id]);
        if (!rows.length) return res.status(404).json({ message: "Staff member not found" });

        const staff = rows[0];
        const attendance = typeof staff.attendance === "string" ? JSON.parse(staff.attendance) : staff.attendance || [];
        attendance.push({ date: date || new Date().toISOString().split("T")[0], status });

        const updated = await db.query(
            `UPDATE staff SET attendance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            [JSON.stringify(attendance), id]
        );

        res.json(mapStaff(updated.rows[0]));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const requestLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { leaveType, startDate, endDate, reason } = req.body;
        const { rows } = await db.query("SELECT * FROM staff WHERE id = $1", [id]);
        if (!rows.length) return res.status(404).json({ message: "Staff member not found" });

        res.json({ message: "Leave request submitted successfully", leaveDetails: { leaveType, startDate, endDate, reason } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getStaff,
    getStaffById,
    createStaff,
    updateStaff,
    deleteStaff,
    recordAttendance,
    requestLeave,
};
