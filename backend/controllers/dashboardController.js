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

    res.json({
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      totalRevenue,
      pendingRevenue,
      recentAppointments,
      appointmentsByStatus: statusGroupRes.rows,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStats };
