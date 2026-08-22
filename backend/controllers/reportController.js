const db = require("../config/db");

const getReportsSummary = async (req, res) => {
    try {
        const pRes = await db.query("SELECT COUNT(*) FROM patients");
        const dRes = await db.query("SELECT COUNT(*) FROM doctors");
        const aRes = await db.query("SELECT COUNT(*) FROM appointments");
        const sRes = await db.query("SELECT COUNT(*) FROM staff");
        const lRes = await db.query("SELECT COUNT(*) FROM laboratory");
        const mRes = await db.query("SELECT COUNT(*) FROM medicines");

        const totalPatients = Number(pRes.rows[0].count);
        const totalDoctors = Number(dRes.rows[0].count);
        const totalAppointments = Number(aRes.rows[0].count);
        const totalStaff = Number(sRes.rows[0].count);
        const totalLabTests = Number(lRes.rows[0].count);
        const totalMedicines = Number(mRes.rows[0].count);

        const paidRevRes = await db.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM billing WHERE status = 'Paid'");
        const totalRevenue = Number(paidRevRes.rows[0].total);

        const pendRevRes = await db.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM billing WHERE status = 'Pending'");
        const totalPendingRevenue = Number(pendRevRes.rows[0].total);

        const allBills = await db.query("SELECT items FROM billing");
        const revenueByCategory = {
            Consultation: 0,
            Laboratory: 0,
            Pharmacy: 0,
            Admission: 0,
            Other: 0,
        };

        allBills.rows.forEach((b) => {
            const items = typeof b.items === "string" ? JSON.parse(b.items) : b.items || [];
            if (Array.isArray(items)) {
                items.forEach((item) => {
                    const cat = item.category || "Other";
                    if (revenueByCategory[cat] !== undefined) {
                        revenueByCategory[cat] += Number(item.amount || 0);
                    } else {
                        revenueByCategory.Other += Number(item.amount || 0);
                    }
                });
            }
        });

        const lowStockRes = await db.query("SELECT * FROM medicines WHERE quantity_in_stock <= min_stock_level ORDER BY name ASC");
        const lowStockMedicines = lowStockRes.rows.map((m) => ({
            _id: m.id,
            id: m.id,
            name: m.name,
            category: m.category,
            batchNumber: m.batch_number,
            quantityInStock: Number(m.quantity_in_stock),
            minStockLevel: Number(m.min_stock_level),
            unitPrice: Number(m.unit_price),
            expiryDate: m.expiry_date,
        }));

        const pendLabRes = await db.query("SELECT COUNT(*) FROM laboratory WHERE status != 'Completed'");
        const pendingLabTests = Number(pendLabRes.rows[0].count);

        // Patient Demographics: by gender
        const genderRes = await db.query("SELECT gender as _id, COUNT(*)::int as count FROM patients GROUP BY gender ORDER BY count DESC");
        const patientsByGender = genderRes.rows;

        // Patient Demographics: by status
        const patStatusRes = await db.query("SELECT status as _id, COUNT(*)::int as count FROM patients GROUP BY status ORDER BY count DESC");
        const patientsByStatus = patStatusRes.rows;

        // Appointment Analytics: by status
        const apptStatusRes = await db.query("SELECT status as _id, COUNT(*)::int as count FROM appointments GROUP BY status ORDER BY count DESC");
        const appointmentsByStatus = apptStatusRes.rows;

        // Appointment Analytics: by department (via doctor)
        const apptDeptRes = await db.query(`
            SELECT d.department as _id, COUNT(*)::int as count
            FROM appointments a
            LEFT JOIN doctors d ON a.doctor_id = d.id
            WHERE d.department IS NOT NULL
            GROUP BY d.department
            ORDER BY count DESC
        `);
        const appointmentsByDepartment = apptDeptRes.rows;

        // Appointment Analytics: 30-day trend (appointments per day)
        const trendRes = await db.query(`
            SELECT appointment_date::date as date, COUNT(*)::int as count
            FROM appointments
            WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY appointment_date::date
            ORDER BY date ASC
        `);
        const appointmentTrend = trendRes.rows.map((r) => ({
            date: r.date,
            count: r.count,
        }));

        res.json({
            summary: {
                totalPatients,
                totalDoctors,
                totalAppointments,
                totalStaff,
                totalLabTests,
                pendingLabTests,
                totalMedicines,
                lowStockCount: lowStockMedicines.length,
                totalRevenue,
                totalPendingRevenue,
            },
            revenueByCategory,
            lowStockMedicines,
            patientDemographics: {
                byGender: patientsByGender,
                byStatus: patientsByStatus,
            },
            appointmentAnalytics: {
                byStatus: appointmentsByStatus,
                byDepartment: appointmentsByDepartment,
                trend30Days: appointmentTrend,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getReportsSummary };
