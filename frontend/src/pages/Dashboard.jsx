import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
  Check,
  X,
  Search,
  Trash2,
  Mail,
  Calendar,
  LayoutDashboard,
  RefreshCw,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import api from "../api/axios";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const COLORS = ["#f59e0b", "#5b6df8", "#20a570", "#ff6b5b"];

const ROLE_BADGE_STYLES = {
  admin: "bg-red-50 text-red-700 border-red-200",
  doctor: "bg-blue-50 text-blue-700 border-blue-200",
  nurse: "bg-teal-50 text-teal-700 border-teal-200",
  receptionist: "bg-purple-50 text-purple-700 border-purple-200",
  lab: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pharmacist: "bg-amber-50 text-amber-700 border-amber-200",
  accountant: "bg-rose-50 text-rose-700 border-rose-200",
};

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam === "approvals" ? "approvals" : "overview");

  // Dashboard stats state
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // User Registrations approval state
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [regFilter, setRegFilter] = useState("Pending"); // "Pending", "Approved", "Rejected", "All"
  const [regSearch, setRegSearch] = useState("");

  useEffect(() => {
    if (tabParam === "approvals" && isAdmin) {
      setActiveTab("approvals");
    }
  }, [tabParam, isAdmin]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/dashboard/stats");
      setStats(data);
    } catch (error) {
      toast.error("Could not load dashboard stats.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    if (!isAdmin) return;
    setLoadingRegs(true);
    try {
      const { data } = await api.get("/auth/registrations");
      setRegistrations(Array.isArray(data) ? data : (data?.registrations || []));
    } catch (error) {
      console.error("Failed to load registrations:", error);
      setRegistrations([]);
    } finally {
      setLoadingRegs(false);
    }
  };

  useEffect(() => {
    fetchStats();
    if (isAdmin) {
      fetchRegistrations();
    }
  }, [isAdmin]);

  const safeRegistrations = useMemo(() => {
    return Array.isArray(registrations) ? registrations : [];
  }, [registrations]);

  const pendingCount = useMemo(() => {
    return safeRegistrations.filter((r) => r && (r.status === "Pending" || r.isApproved === false)).length;
  }, [safeRegistrations]);

  const approvedCount = useMemo(() => {
    return safeRegistrations.filter((r) => r && r.status === "Approved").length;
  }, [safeRegistrations]);

  const rejectedCount = useMemo(() => {
    return safeRegistrations.filter((r) => r && r.status === "Rejected").length;
  }, [safeRegistrations]);

  const totalCount = useMemo(() => {
    return safeRegistrations.length;
  }, [safeRegistrations]);

  const filteredRegistrations = useMemo(() => {
    return safeRegistrations.filter((r) => {
      if (!r) return false;
      // Status match
      if (regFilter === "Pending" && r.status !== "Pending" && r.isApproved !== false) return false;
      if (regFilter === "Approved" && r.status !== "Approved") return false;
      if (regFilter === "Rejected" && r.status !== "Rejected") return false;

      // Search match
      if (regSearch.trim()) {
        const q = regSearch.toLowerCase();
        const matchName = (r.name || "").toLowerCase().includes(q);
        const matchEmail = (r.email || "").toLowerCase().includes(q);
        const matchRole = (r.role || "").toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchRole) return false;
      }

      return true;
    });
  }, [safeRegistrations, regFilter, regSearch]);

  const handleApprove = async (id, name) => {
    try {
      await api.put(`/auth/registrations/${id}/approve`);
      toast.success(`Approved account for ${name}`);
      fetchRegistrations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve user");
    }
  };

  const handleReject = async (id, name) => {
    try {
      await api.put(`/auth/registrations/${id}/reject`);
      toast.success(`Rejected registration for ${name}`);
      fetchRegistrations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject user");
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to permanently remove registration record for ${name}?`)) return;
    try {
      await api.delete(`/auth/registrations/${id}`);
      toast.success(`Removed registration for ${name}`);
      fetchRegistrations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  if (loading && activeTab === "overview") {
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
  const lowStockList = pharmacyAlerts?.lowStockMedicines || pharmacyAlerts?.lowStockItems || [];
  const nearExpiryList = pharmacyAlerts?.nearExpiryMedicines || pharmacyAlerts?.nearExpiryItems || [];
  const lowStockCount = pharmacyAlerts?.lowStockCount ?? lowStockList.length;
  const nearExpiryCount = pharmacyAlerts?.nearExpiryCount ?? nearExpiryList.length;
  const hasAlerts = (lowStockCount > 0 || nearExpiryCount > 0);

  return (
    <div className="space-y-6">
      {/* Header & Role Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {activeTab === "overview" ? "Hospital Dashboard" : "User Registration Approvals"}
          </h1>
          <p className="text-gray-500">
            {activeTab === "overview"
              ? "Welcome to Medicare Hospital System central control center."
              : "Review, approve, and manage new staff registration requests."}
          </p>
        </div>

        {/* Tab Switcher for Admin */}
        {isAdmin && (
          <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner border border-gray-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab("overview");
                setSearchParams({});
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "overview"
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <LayoutDashboard size={16} /> Overview
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("approvals");
                setSearchParams({ tab: "approvals" });
                fetchRegistrations();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${
                activeTab === "approvals"
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ShieldCheck size={16} /> User Approvals
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ========== TAB CONTENT: USER APPROVALS ========== */}
      {isAdmin && activeTab === "approvals" ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 border border-gray-100">
              <span className="text-xs text-gray-400 font-medium block">Total Registered Users</span>
              <span className="text-2xl font-bold text-gray-800 mt-1 block">{totalCount}</span>
            </div>
            <div className="card p-4 border-l-4 border-l-amber-500 bg-amber-50/20">
              <span className="text-xs text-amber-700 font-semibold block flex items-center gap-1">
                <Clock size={12} /> Pending Approval
              </span>
              <span className="text-2xl font-bold text-amber-600 mt-1 block">{pendingCount}</span>
            </div>
            <div className="card p-4 border-l-4 border-l-emerald-500 bg-emerald-50/20">
              <span className="text-xs text-emerald-700 font-semibold block flex items-center gap-1">
                <Check size={12} /> Approved Accounts
              </span>
              <span className="text-2xl font-bold text-emerald-600 mt-1 block">{approvedCount}</span>
            </div>
            <div className="card p-4 border-l-4 border-l-rose-500 bg-rose-50/20">
              <span className="text-xs text-rose-700 font-semibold block flex items-center gap-1">
                <X size={12} /> Rejected Requests
              </span>
              <span className="text-2xl font-bold text-rose-600 mt-1 block">{rejectedCount}</span>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="card p-4 space-y-3 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Filter by staff name, email, or role..."
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  className="input-field pl-9 py-2 text-sm"
                />
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={fetchRegistrations}
                disabled={loadingRegs}
                className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-1.5 w-fit"
              >
                <RefreshCw size={13} className={loadingRegs ? "animate-spin" : ""} /> Refresh List
              </button>
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-2 pt-1 border-t border-gray-100 overflow-x-auto text-xs">
              <span className="text-gray-400 font-medium shrink-0">Filter Status:</span>
              {[
                { key: "Pending", label: "Pending Review", count: pendingCount },
                { key: "Approved", label: "Approved", count: approvedCount },
                { key: "Rejected", label: "Rejected", count: rejectedCount },
                { key: "All", label: "All Registrations", count: totalCount },
              ].map(({ key, label, count }) => {
                const active = regFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRegFilter(key)}
                    className={`px-3 py-1 rounded-full font-semibold transition shrink-0 flex items-center gap-1.5 ${
                      active
                        ? "bg-primary-600 text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Registrations List */}
          <div className="card overflow-x-auto border border-gray-100">
            {loadingRegs ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
              </div>
            ) : filteredRegistrations.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100 bg-gray-50/50">
                    <th className="py-3 px-3 font-medium">User Profile</th>
                    <th className="py-3 px-3 font-medium">Requested Role</th>
                    <th className="py-3 px-3 font-medium">Registered Date</th>
                    <th className="py-3 px-3 font-medium text-center">Status</th>
                    <th className="py-3 px-3 font-medium text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((u) => {
                    const isPending = u.status === "Pending" || u.isApproved === false;
                    const isApproved = u.status === "Approved";
                    const isRejected = u.status === "Rejected";

                    return (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {(u.name || "U")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{u.name}</div>
                              <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Mail size={11} /> {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                              ROLE_BADGE_STYLES[u.role?.toLowerCase()] || "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-gray-400" />
                            {new Date(u.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={11} /> Pending
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check size={11} /> Approved
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <X size={11} /> Rejected
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(u.id, u.name)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-xs flex items-center gap-1"
                                >
                                  <Check size={13} /> Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(u.id, u.name)}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-medium transition border border-amber-200 flex items-center gap-1"
                                >
                                  <X size={13} /> Reject
                                </button>
                              </>
                            )}

                            {isRejected && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(u.id, u.name)}
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition border border-emerald-200 flex items-center gap-1"
                                >
                                  <Check size={13} /> Re-Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(u.id, u.name)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete record"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}

                            {isApproved && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleReject(u.id, u.name)}
                                  className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-xs font-medium transition"
                                >
                                  Revoke
                                </button>
                                {u.role?.toLowerCase() !== "admin" && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(u.id, u.name)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                    title="Delete user"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-gray-400 space-y-1">
                <UserCheck size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="font-semibold text-gray-600 text-sm">No registrations found</p>
                <p className="text-xs">No user accounts match the selected filter criteria.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========== TAB CONTENT: OVERVIEW ========== */
        <div className="space-y-6">
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
                    {lowStockCount > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-600 mb-1.5 flex items-center gap-1">
                          <PackageX size={14} /> {lowStockCount} Low Stock Items
                        </p>
                        <div className="space-y-1">
                          {lowStockList.slice(0, 3).map((item) => (
                            <div key={item._id || item.id} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-red-100">
                              <span className="font-medium text-gray-700">{item.name}</span>
                              <span className="text-red-500 font-semibold">
                                {item.quantityInStock ?? item.stock ?? 0} left (min: {item.minStockLevel ?? item.minStock ?? 0})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expiry Alerts */}
                    {nearExpiryCount > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-600 mb-1.5 flex items-center gap-1">
                          <Clock size={14} /> {nearExpiryCount} Near Expiry Items
                        </p>
                        <div className="space-y-1">
                          {nearExpiryList.slice(0, 3).map((item) => (
                            <div key={item._id || item.id} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-amber-100">
                              <span className="font-medium text-gray-700">{item.name}</span>
                              <span className="text-amber-600 font-semibold">
                                Exp: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "N/A"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Modules */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3">Quick Navigation Modules</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickModules.map((m) => {
                const Icon = m.icon;
                return (
                  <Link
                    key={m.title}
                    to={m.to}
                    className="card p-4 hover:-translate-y-1 transition-all group flex items-center justify-between border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${m.color}`}>
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
      )}
    </div>
  );
};

export default Dashboard;
