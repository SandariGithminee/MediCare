const db = require("../config/db");

// 1. Executive Summary (Overview)
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

        const paidRevRes = await db.query("SELECT COALESCE(SUM(paid_amount), 0) as total FROM billing");
        const totalRevenue = Number(paidRevRes.rows[0].total);

        const totalBilledRes = await db.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM billing");
        const totalBilled = Number(totalBilledRes.rows[0].total);
        const totalPendingRevenue = Math.max(0, totalBilled - totalRevenue);

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

        // Patient Demographics
        const genderRes = await db.query("SELECT COALESCE(gender, 'Unknown') as _id, COUNT(*)::int as count FROM patients GROUP BY gender ORDER BY count DESC");
        const patStatusRes = await db.query("SELECT COALESCE(status, 'Active') as _id, COUNT(*)::int as count FROM patients GROUP BY status ORDER BY count DESC");

        // Appointment Analytics
        const apptStatusRes = await db.query("SELECT status as _id, COUNT(*)::int as count FROM appointments GROUP BY status ORDER BY count DESC");
        const apptDeptRes = await db.query(`
            SELECT COALESCE(d.department, 'General') as _id, COUNT(*)::int as count
            FROM appointments a
            LEFT JOIN doctors d ON a.doctor_id = d.id
            GROUP BY d.department
            ORDER BY count DESC
        `);

        const trendRes = await db.query(`
            SELECT appointment_date::date as date, COUNT(*)::int as count
            FROM appointments
            WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY appointment_date::date
            ORDER BY date ASC
        `);

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
                totalBilled,
            },
            revenueByCategory,
            lowStockMedicines,
            patientDemographics: {
                byGender: genderRes.rows,
                byStatus: patStatusRes.rows,
            },
            appointmentAnalytics: {
                byStatus: apptStatusRes.rows,
                byDepartment: apptDeptRes.rows,
                trend30Days: trendRes.rows,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Patient Reports
const getPatientReports = async (req, res) => {
    try {
        const totalRes = await db.query("SELECT COUNT(*) FROM patients");
        const activeRes = await db.query("SELECT COUNT(*) FROM patients WHERE status = 'Active'");
        const admittedRes = await db.query("SELECT COUNT(*) FROM patients WHERE status = 'Admitted'");
        const dischargedRes = await db.query("SELECT COUNT(*) FROM patients WHERE status = 'Discharged'");
        const newMonthRes = await db.query("SELECT COUNT(*) FROM patients WHERE created_at >= date_trunc('month', CURRENT_DATE)");

        const genderRes = await db.query("SELECT COALESCE(gender, 'Unknown') as name, COUNT(*)::int as value FROM patients GROUP BY gender ORDER BY value DESC");
        
        const ageGroupRes = await db.query(`
            SELECT 
                CASE 
                    WHEN age < 18 THEN '< 18'
                    WHEN age BETWEEN 18 AND 35 THEN '18-35'
                    WHEN age BETWEEN 36 AND 50 THEN '36-50'
                    WHEN age BETWEEN 51 AND 65 THEN '51-65'
                    ELSE '65+'
                END as name,
                COUNT(*)::int as count
            FROM patients
            GROUP BY name
            ORDER BY name ASC
        `);

        const bloodGroupRes = await db.query("SELECT COALESCE(blood_group, 'Unknown') as name, COUNT(*)::int as count FROM patients GROUP BY blood_group ORDER BY count DESC");

        const trendRes = await db.query(`
            SELECT TO_CHAR(created_at, 'Mon YYYY') as month, date_trunc('month', created_at) as m_date, COUNT(*)::int as count
            FROM patients
            WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY month, m_date
            ORDER BY m_date ASC
        `);

        const patientListRes = await db.query(`
            SELECT id, first_name, last_name, email, phone, age, gender, blood_group, status, emergency_contact, created_at
            FROM patients
            ORDER BY created_at DESC
            LIMIT 100
        `);

        res.json({
            metrics: {
                total: Number(totalRes.rows[0].count),
                active: Number(activeRes.rows[0].count),
                admitted: Number(admittedRes.rows[0].count),
                discharged: Number(dischargedRes.rows[0].count),
                newThisMonth: Number(newMonthRes.rows[0].count),
            },
            genderData: genderRes.rows,
            ageGroupData: ageGroupRes.rows,
            bloodGroupData: bloodGroupRes.rows,
            registrationTrend: trendRes.rows,
            patients: patientListRes.rows.map(p => ({
                id: p.id,
                name: `${p.first_name} ${p.last_name}`,
                email: p.email,
                phone: p.phone,
                age: p.age,
                gender: p.gender,
                bloodGroup: p.blood_group,
                status: p.status,
                emergencyContact: p.emergency_contact,
                registeredAt: p.created_at,
            })),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Appointment Reports
const getAppointmentReports = async (req, res) => {
    try {
        const totalRes = await db.query("SELECT COUNT(*) FROM appointments");
        const completedRes = await db.query("SELECT COUNT(*) FROM appointments WHERE status = 'Completed'");
        const confirmedRes = await db.query("SELECT COUNT(*) FROM appointments WHERE status = 'Confirmed'");
        const pendingRes = await db.query("SELECT COUNT(*) FROM appointments WHERE status = 'Pending'");
        const cancelledRes = await db.query("SELECT COUNT(*) FROM appointments WHERE status = 'Cancelled'");

        const total = Number(totalRes.rows[0].count);
        const completed = Number(completedRes.rows[0].count);
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        const statusRes = await db.query("SELECT status as name, COUNT(*)::int as value FROM appointments GROUP BY status ORDER BY value DESC");

        const deptRes = await db.query(`
            SELECT COALESCE(d.department, 'General') as name, COUNT(*)::int as count
            FROM appointments a
            LEFT JOIN doctors d ON a.doctor_id = d.id
            GROUP BY d.department
            ORDER BY count DESC
        `);

        const doctorLoadRes = await db.query(`
            SELECT d.name as doctor_name, COALESCE(d.department, 'General') as department, COUNT(a.id)::int as count
            FROM doctors d
            LEFT JOIN appointments a ON d.id = a.doctor_id
            GROUP BY d.id, d.name, d.department
            ORDER BY count DESC
            LIMIT 8
        `);

        const trendRes = await db.query(`
            SELECT appointment_date::date as date, COUNT(*)::int as count
            FROM appointments
            WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY appointment_date::date
            ORDER BY date ASC
        `);

        const listRes = await db.query(`
            SELECT a.id, a.appointment_date, a.appointment_time, a.status, a.reason,
                   p.first_name || ' ' || p.last_name as patient_name, p.phone as patient_phone,
                   d.name as doctor_name, d.department as doctor_department
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN doctors d ON a.doctor_id = d.id
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
            LIMIT 100
        `);

        res.json({
            metrics: {
                total,
                completed,
                confirmed: Number(confirmedRes.rows[0].count),
                pending: Number(pendingRes.rows[0].count),
                cancelled: Number(cancelledRes.rows[0].count),
                completionRate,
            },
            statusData: statusRes.rows,
            departmentData: deptRes.rows,
            doctorWorkload: doctorLoadRes.rows,
            trend30Days: trendRes.rows,
            appointments: listRes.rows.map(a => ({
                id: a.id,
                date: a.appointment_date,
                time: a.appointment_time,
                status: a.status,
                reason: a.reason,
                patientName: a.patient_name || "Unknown Patient",
                patientPhone: a.patient_phone || "N/A",
                doctorName: a.doctor_name || "Unknown Doctor",
                department: a.doctor_department || "General",
            })),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Revenue Reports
const getRevenueReports = async (req, res) => {
    try {
        const billedRes = await db.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM billing");
        const paidRes = await db.query("SELECT COALESCE(SUM(paid_amount), 0) as total FROM billing");
        const countRes = await db.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Paid') as paid, COUNT(*) FILTER (WHERE status = 'Pending') as pending, COUNT(*) FILTER (WHERE status = 'Partial') as partial FROM billing");

        const totalBilled = Number(billedRes.rows[0].total);
        const totalPaid = Number(paidRes.rows[0].total);
        const totalPending = Math.max(0, totalBilled - totalPaid);
        const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

        // Revenue by Service Category
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

        const categoryData = Object.entries(revenueByCategory).map(([name, amount]) => ({
            name,
            amount,
        }));

        // Payment Method distribution
        const methodRes = await db.query(`
            SELECT COALESCE(payment_method, 'Cash') as name, 
                   COUNT(*)::int as count, 
                   COALESCE(SUM(paid_amount), 0)::numeric as total
            FROM billing
            GROUP BY payment_method
            ORDER BY total DESC
        `);

        // Monthly trend (last 6 months)
        const trendRes = await db.query(`
            SELECT TO_CHAR(date, 'Mon YYYY') as month, date_trunc('month', date) as m_date,
                   COALESCE(SUM(paid_amount), 0)::numeric as paid,
                   COALESCE(SUM(total_amount), 0)::numeric as billed
            FROM billing
            WHERE date >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY month, m_date
            ORDER BY m_date ASC
        `);

        // Recent billing ledger
        const ledgerRes = await db.query(`
            SELECT b.id, b.invoice_number, b.total_amount, b.paid_amount, b.status, b.payment_method, b.date,
                   p.first_name || ' ' || p.last_name as patient_name
            FROM billing b
            LEFT JOIN patients p ON b.patient_id = p.id
            ORDER BY b.date DESC
            LIMIT 100
        `);

        res.json({
            metrics: {
                totalBilled,
                totalPaid,
                totalPending,
                collectionRate,
                invoiceCount: Number(countRes.rows[0].total),
                paidCount: Number(countRes.rows[0].paid),
                pendingCount: Number(countRes.rows[0].pending),
                partialCount: Number(countRes.rows[0].partial),
            },
            categoryData,
            paymentMethodData: methodRes.rows,
            monthlyTrend: trendRes.rows,
            ledger: ledgerRes.rows.map(b => ({
                id: b.id,
                invoiceNumber: b.invoice_number,
                patientName: b.patient_name || "Guest / Walk-in",
                totalAmount: Number(b.total_amount),
                paidAmount: Number(b.paid_amount),
                balance: Math.max(0, Number(b.total_amount) - Number(b.paid_amount)),
                status: b.status,
                paymentMethod: b.payment_method || "Cash",
                date: b.date,
            })),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. Pharmacy Reports
const getPharmacyReports = async (req, res) => {
    try {
        const totalItemsRes = await db.query("SELECT COUNT(*) FROM medicines");
        const stockUnitsRes = await db.query("SELECT COALESCE(SUM(quantity_in_stock), 0) as total FROM medicines");
        const valuationRes = await db.query("SELECT COALESCE(SUM(quantity_in_stock * unit_price), 0) as total FROM medicines");
        
        const lowStockRes = await db.query("SELECT COUNT(*) FROM medicines WHERE quantity_in_stock <= min_stock_level AND quantity_in_stock > 0");
        const outOfStockRes = await db.query("SELECT COUNT(*) FROM medicines WHERE quantity_in_stock = 0");
        const expiredRes = await db.query("SELECT COUNT(*) FROM medicines WHERE expiry_date < CURRENT_DATE");
        const expiringSoonRes = await db.query("SELECT COUNT(*) FROM medicines WHERE expiry_date >= CURRENT_DATE AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'");

        const totalItems = Number(totalItemsRes.rows[0].count);
        const lowStockCount = Number(lowStockRes.rows[0].count);
        const outOfStockCount = Number(outOfStockRes.rows[0].count);
        const expiredCount = Number(expiredRes.rows[0].count);
        const adequateStockCount = Math.max(0, totalItems - lowStockCount - outOfStockCount - expiredCount);

        // Stock Health distribution
        const stockHealthData = [
            { name: "Adequate Stock", value: adequateStockCount },
            { name: "Low Stock", value: lowStockCount },
            { name: "Out of Stock", value: outOfStockCount },
            { name: "Expired", value: expiredCount },
        ].filter(d => d.value > 0);

        // Valuation by Category
        const categoryValuationRes = await db.query(`
            SELECT category as name,
                   COUNT(*)::int as item_count,
                   COALESCE(SUM(quantity_in_stock), 0)::int as stock_units,
                   COALESCE(SUM(quantity_in_stock * unit_price), 0)::numeric as valuation
            FROM medicines
            GROUP BY category
            ORDER BY valuation DESC
        `);

        // Low stock reorder table
        const lowStockListRes = await db.query(`
            SELECT id, name, category, manufacturer, batch_number, quantity_in_stock, min_stock_level, unit_price, expiry_date, location
            FROM medicines
            WHERE quantity_in_stock <= min_stock_level
            ORDER BY quantity_in_stock ASC
        `);

        // Expiry monitoring table (all medicines ordered by expiry date)
        const expiryListRes = await db.query(`
            SELECT id, name, category, batch_number, quantity_in_stock, unit_price, expiry_date,
                   (expiry_date - CURRENT_DATE)::int as days_until_expiry
            FROM medicines
            ORDER BY expiry_date ASC
            LIMIT 100
        `);

        res.json({
            metrics: {
                totalMedicines: totalItems,
                totalStockUnits: Number(stockUnitsRes.rows[0].total),
                totalValuation: Number(valuationRes.rows[0].total),
                lowStockCount,
                outOfStockCount,
                expiredCount,
                expiringSoonCount: Number(expiringSoonRes.rows[0].count),
            },
            stockHealthData,
            categoryValuation: categoryValuationRes.rows,
            lowStockList: lowStockListRes.rows.map(m => ({
                id: m.id,
                name: m.name,
                category: m.category,
                manufacturer: m.manufacturer,
                batchNumber: m.batch_number,
                quantityInStock: Number(m.quantity_in_stock),
                minStockLevel: Number(m.min_stock_level),
                unitPrice: Number(m.unit_price),
                expiryDate: m.expiry_date,
                location: m.location,
            })),
            expiryList: expiryListRes.rows.map(m => ({
                id: m.id,
                name: m.name,
                category: m.category,
                batchNumber: m.batch_number,
                quantityInStock: Number(m.quantity_in_stock),
                unitPrice: Number(m.unit_price),
                expiryDate: m.expiry_date,
                daysUntilExpiry: Number(m.days_until_expiry),
            })),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. Laboratory Reports
const getLaboratoryReports = async (req, res) => {
    try {
        const totalRes = await db.query("SELECT COUNT(*) FROM laboratory");
        const completedRes = await db.query("SELECT COUNT(*) FROM laboratory WHERE status = 'Completed'");
        const requestedRes = await db.query("SELECT COUNT(*) FROM laboratory WHERE status = 'Requested' OR status = 'Pending'");
        const inProgressRes = await db.query("SELECT COUNT(*) FROM laboratory WHERE status = 'In Progress'");
        const revenueRes = await db.query("SELECT COALESCE(SUM(cost), 0) as total FROM laboratory WHERE status = 'Completed'");

        const total = Number(totalRes.rows[0].count);
        const completed = Number(completedRes.rows[0].count);
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        const categoryRes = await db.query(`
            SELECT COALESCE(test_category, 'General') as name, COUNT(*)::int as count
            FROM laboratory
            GROUP BY test_category
            ORDER BY count DESC
        `);

        const statusRes = await db.query(`
            SELECT status as name, COUNT(*)::int as value
            FROM laboratory
            GROUP BY status
            ORDER BY value DESC
        `);

        const testListRes = await db.query(`
            SELECT l.id, l.test_name, l.test_category, l.status, l.cost, l.requested_date, l.completed_at,
                   l.result_value, l.normal_range, l.unit,
                   p.first_name || ' ' || p.last_name as patient_name,
                   d.name as doctor_name
            FROM laboratory l
            LEFT JOIN patients p ON l.patient_id = p.id
            LEFT JOIN doctors d ON l.doctor_id = d.id
            ORDER BY l.requested_date DESC
            LIMIT 100
        `);

        res.json({
            metrics: {
                totalTests: total,
                completedTests: completed,
                pendingTests: Number(requestedRes.rows[0].count),
                inProgressTests: Number(inProgressRes.rows[0].count),
                labRevenue: Number(revenueRes.rows[0].total),
                completionRate,
            },
            categoryData: categoryRes.rows,
            statusData: statusRes.rows,
            tests: testListRes.rows.map(t => ({
                id: t.id,
                testName: t.test_name,
                category: t.test_category,
                status: t.status,
                cost: Number(t.cost || 0),
                requestedDate: t.requested_date,
                completedAt: t.completed_at,
                resultValue: t.result_value,
                normalRange: t.normal_range,
                unit: t.unit,
                patientName: t.patient_name || "Unknown Patient",
                doctorName: t.doctor_name || "Unknown Doctor",
            })),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 7. Staff Reports
const getStaffReports = async (req, res) => {
    try {
        const totalRes = await db.query("SELECT COUNT(*) FROM staff");
        const activeRes = await db.query("SELECT COUNT(*) FROM staff WHERE status = 'Active'");
        const deptCountRes = await db.query("SELECT COUNT(DISTINCT department) FROM staff");
        const payrollRes = await db.query("SELECT COALESCE(SUM(salary), 0) as total FROM staff WHERE status = 'Active'");

        const deptDistRes = await db.query(`
            SELECT department as name, COUNT(*)::int as count, COALESCE(SUM(salary), 0)::numeric as total_salary
            FROM staff
            GROUP BY department
            ORDER BY count DESC
        `);

        const roleDistRes = await db.query(`
            SELECT role as name, COUNT(*)::int as value
            FROM staff
            GROUP BY role
            ORDER BY value DESC
        `);

        const allStaffRes = await db.query("SELECT * FROM staff ORDER BY name ASC");
        
        const todayStr = new Date().toISOString().split("T")[0];
        let todayPresent = 0;
        let todayAbsent = 0;
        let todayLate = 0;

        const staffRoster = allStaffRes.rows.map(s => {
            const att = Array.isArray(s.attendance) ? s.attendance : (typeof s.attendance === "string" ? JSON.parse(s.attendance || "[]") : []);
            const leaves = Array.isArray(s.leaves) ? s.leaves : (typeof s.leaves === "string" ? JSON.parse(s.leaves || "[]") : []);

            const todayRecord = att.find(a => a.date === todayStr);
            const todayStatus = todayRecord ? todayRecord.status : "Not Marked";

            if (todayStatus === "Present") todayPresent++;
            else if (todayStatus === "Absent") todayAbsent++;
            else if (todayStatus === "Late") todayLate++;

            // Monthly attendance rate
            const presentDays = att.filter(a => a.status === "Present" || a.status === "Late").length;
            const totalMarked = att.length;
            const attendanceRate = totalMarked > 0 ? Math.round((presentDays / totalMarked) * 100) : 100;

            return {
                id: s.id,
                employeeId: s.employee_id,
                name: s.name,
                role: s.role,
                department: s.department,
                email: s.email,
                phone: s.phone,
                salary: Number(s.salary),
                joinDate: s.join_date,
                status: s.status,
                todayStatus,
                attendanceRate,
                totalLeaves: leaves.length,
                pendingLeaves: leaves.filter(l => l.status === "Pending").length,
                leaves,
            };
        });

        const totalStaff = Number(totalRes.rows[0].count);
        const todayAttendanceRate = totalStaff > 0 ? Math.round(((todayPresent + todayLate) / totalStaff) * 100) : 0;

        // Flatten recent leave records
        const recentLeaves = [];
        staffRoster.forEach(s => {
            s.leaves.forEach(l => {
                recentLeaves.push({
                    ...l,
                    staffName: s.name,
                    employeeId: s.employeeId,
                    department: s.department,
                    role: s.role,
                });
            });
        });
        recentLeaves.sort((a, b) => new Date(b.requestedAt || b.from) - new Date(a.requestedAt || a.from));

        res.json({
            metrics: {
                totalStaff,
                activeStaff: Number(activeRes.rows[0].count),
                departmentCount: Number(deptCountRes.rows[0].count),
                monthlyPayroll: Number(payrollRes.rows[0].total),
                todayPresent,
                todayAbsent,
                todayLate,
                todayAttendanceRate,
                totalLeavesLogged: recentLeaves.length,
            },
            departmentDistribution: deptDistRes.rows,
            roleDistribution: roleDistRes.rows,
            staffRoster,
            recentLeaves: recentLeaves.slice(0, 50),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getReportsSummary,
    getPatientReports,
    getAppointmentReports,
    getRevenueReports,
    getPharmacyReports,
    getLaboratoryReports,
    getStaffReports,
};
