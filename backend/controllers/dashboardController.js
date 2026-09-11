const db = require("../config/db");

const getStats = async (req, res) => {
  try {
    const patientsRes = await db.query("SELECT COUNT(*) FROM patients");
    const totalPatients = Number(patientsRes.rows[0].count);

    const doctorsRes = await db.query("SELECT COUNT(*) FROM doctors");
    const totalDoctors = Number(doctorsRes.rows[0].count);

    const apptsRes = await db.query("SELECT COUNT(*) FROM appointments");
    const totalAppointments = Number(apptsRes.rows[0].count);

    const todayApptsRes = await db.query("SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE");
    const todayAppointments = Number(todayApptsRes.rows[0].count);

    const revenueRes = await db.query("SELECT COALESCE(SUM(paid_amount), 0) as total_rev, COALESCE(SUM(total_amount - paid_amount), 0) as pending_rev FROM billing");
    const totalRevenue = Number(revenueRes.rows[0].total_rev);
    const pendingRevenue = Number(revenueRes.rows[0].pending_rev);

    const recentApptsRes = await db.query(`
      SELECT 
        a.id, a.appointment_date, a.appointment_time, a.status, a.reason,
        p.first_name as p_first_name, p.last_name as p_last_name,
        d.name as d_name, d.specialization as d_specialization
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      ORDER BY a.created_at DESC
      LIMIT 5
    `);

    const recentAppointments = recentApptsRes.rows.map((row) => ({
      _id: row.id,
      id: row.id,
      patient: { firstName: row.p_first_name || "Patient", lastName: row.p_last_name || "" },
      doctor: { name: row.d_name || "Doctor", specialization: row.d_specialization || "" },
      date: row.appointment_date,
      time: row.appointment_time,
      status: row.status,
      reason: row.reason,
    }));

    const statusGroupRes = await db.query("SELECT status as _id, COUNT(*)::int as count FROM appointments GROUP BY status");

    // Pharmacy Alerts: low stock medicines
    const lowStockRes = await db.query(
      "SELECT id, name, category, quantity_in_stock, min_stock_level FROM medicines WHERE quantity_in_stock <= min_stock_level ORDER BY quantity_in_stock ASC LIMIT 10"
    );
    const lowStockMedicines = lowStockRes.rows.map((m) => ({
      _id: m.id, id: m.id, name: m.name, category: m.category,
      quantityInStock: Number(m.quantity_in_stock), minStockLevel: Number(m.min_stock_level),
    }));

    // Pharmacy Alerts: near-expiry medicines (within 90 days)
    const nearExpiryRes = await db.query(
      "SELECT id, name, category, expiry_date, quantity_in_stock FROM medicines WHERE expiry_date <= CURRENT_DATE + INTERVAL '90 days' AND expiry_date >= CURRENT_DATE ORDER BY expiry_date ASC LIMIT 10"
    );
    const nearExpiryMedicines = nearExpiryRes.rows.map((m) => ({
      _id: m.id, id: m.id, name: m.name, category: m.category,
      expiryDate: m.expiry_date, quantityInStock: Number(m.quantity_in_stock),
    }));

    res.json({
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      totalRevenue,
      pendingRevenue,
      recentAppointments,
      appointmentsByStatus: statusGroupRes.rows,
      pharmacyAlerts: {
        lowStockMedicines,
        nearExpiryMedicines,
        lowStockItems: lowStockMedicines,
        nearExpiryItems: nearExpiryMedicines,
        lowStockCount: lowStockMedicines.length,
        nearExpiryCount: nearExpiryMedicines.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStats };
