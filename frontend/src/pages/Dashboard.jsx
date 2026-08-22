import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Stethoscope,
  CalendarCheck,
  DollarSign,
  Clock,
  TrendingUp,
  FileText,
  FlaskConical,
  Pill,
  Bed,
  UserCheck,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  PackageX,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import api from "../api/axios";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import toast from "react-hot-toast";

const COLORS = ["#f59e0b", "#5b6df8", "#20a570", "#ff6b5b"];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/dashboard/stats");
        setStats(data);
      } catch (error) {
        toast.error("Could not load dashboard stats. Is the backend running & seeded?");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const chartData =
    stats?.appointmentsByStatus?.map((s) => ({ name: s._id, value: s.count })) || [];

  const quickModules = [
    { title: "EMR Records", desc: "Patient diagnoses & prescriptions", icon: FileText, to: "/emr", color: "bg-blue-50 text-blue-600 border-blue-100" },
    { title: "Laboratory", desc: "Test processing & lab reports", icon: FlaskConical, to: "/laboratory", color: "bg-purple-50 text-purple-600 border-purple-100" },
    { title: "Pharmacy", desc: "Medicine stock & dispensing", icon: Pill, to: "/pharmacy", color: "bg-amber-50 text-amber-600 border-amber-100" },
    { title: "Admissions", desc: "Inpatient bed & room tracking", icon: Bed, to: "/admissions", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { title: "Staff Roster", desc: "Attendance & employee details", icon: UserCheck, to: "/staff", color: "bg-teal-50 text-teal-600 border-teal-100" },
    { title: "Reports", desc: "Revenue & hospital analytics", icon: BarChart3, to: "/reports", color: "bg-rose-50 text-rose-600 border-rose-100" },
  ];

  const pharmacyAlerts = stats?.pharmacyAlerts;
  const hasAlerts = pharmacyAlerts && (pharmacyAlerts.lowStockCount > 0 || pharmacyAlerts.nearExpiryCount > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Welcome to Medicare Hospital System central control center.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={Users} label="Total Patients" value={stats?.totalPatients ?? 0} color="primary" />
        <StatCard icon={Stethoscope} label="Total Doctors" value={stats?.totalDoctors ?? 0} color="accent" />
        <StatCard icon={CalendarCheck} label="Today's Appointments" value={stats?.todayAppointments ?? 0} color="coral" />
        <StatCard icon={DollarSign} label="Revenue Collected" value={`LKR ${(stats?.totalRevenue ?? 0).toLocaleString()}`} color="amber" />
      </div>

      {/* Pharmacy Alerts Banner */}
      {hasAlerts && (
        <div className="card border-l-4 border-l-amber-500 bg-amber-50/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-amber-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 mb-2">Pharmacy Alerts</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Low Stock Alerts */}
                {pharmacyAlerts.lowStockCount > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-600 mb-1.5 flex items-center gap-1">
                      <PackageX size={14} /> {pharmacyAlerts.lowStockCount} Low Stock Items
                    </p>
                    <div className="space-y-1">
                      {pharmacyAlerts.lowStockMedicines.slice(0, 4).map((m) => (
                        <div key={m._id} className="flex items-center justify-between text-xs bg-white rounded-lg px-2.5 py-1.5 border border-red-100">
                          <span className="font-medium text-gray-700">{m.name}</span>
                          <span className="font-bold text-red-600">{m.quantityInStock} left</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Near Expiry Alerts */}
                {pharmacyAlerts.nearExpiryCount > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-600 mb-1.5 flex items-center gap-1">
                      <AlertTriangle size={14} /> {pharmacyAlerts.nearExpiryCount} Expiring Soon (≤90 days)
                    </p>
                    <div className="space-y-1">
                      {pharmacyAlerts.nearExpiryMedicines.slice(0, 4).map((m) => (
                        <div key={m._id} className="flex items-center justify-between text-xs bg-white rounded-lg px-2.5 py-1.5 border border-amber-100">
                          <span className="font-medium text-gray-700">{m.name}</span>
                          <span className="font-bold text-amber-600">
                            {new Date(m.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link to="/pharmacy" className="inline-block mt-3 text-xs font-semibold text-amber-700 hover:underline">
                View Full Pharmacy →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickModules.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.to}
              to={m.to}
              className={`p-4 rounded-2xl border ${m.color} hover:shadow-md transition flex items-center justify-between group`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm group-hover:text-primary-700 transition-colors">{m.title}</h4>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Recent Appointments</h3>
            <Clock className="text-gray-300" size={20} />
          </div>
          <div className="space-y-3">
            {stats?.recentAppointments?.length ? (
              stats.recentAppointments.map((a) => (
                <div
                  key={a._id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-semibold text-sm">
                      {a.patient?.firstName?.charAt(0)}
                      {a.patient?.lastName?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {a.patient?.firstName} {a.patient?.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        with {a.doctor?.name} · {a.doctor?.specialization}
                      </p>
                    </div>
                  </div>
                  <Badge status={a.status} />
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm py-6 text-center">
                No appointments yet.
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Appointment Status</h3>
            <TrendingUp className="text-gray-300" size={20} />
          </div>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm py-16 text-center">No data yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
