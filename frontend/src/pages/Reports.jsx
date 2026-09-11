import React, { useEffect, useState } from "react";
import {
  BarChart3, TrendingUp, DollarSign, Users, FlaskConical, Pill, Calendar,
  Printer, UserCheck, CalendarCheck, AlertTriangle, Clock, Search,
  Activity, FileText, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Layers, ChevronRight, Stethoscope, Award
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";
import api from "../api/axios";
import toast from "react-hot-toast";

const COLORS = ["#5b6df8", "#20a570", "#f59e0b", "#ff6b5b", "#8b5cf6", "#06b6d4", "#ec4899", "#64748b"];

const TABS = [
  { id: "overview", label: "Overview", icon: Layers, desc: "Executive hospital operational summary" },
  { id: "patients", label: "Patient Reports", icon: Users, desc: "Demographics, admission status & registry" },
  { id: "appointments", label: "Appointment Reports", icon: CalendarCheck, desc: "Booking trends, doctor loads & schedules" },
  { id: "revenue", label: "Revenue Reports", icon: DollarSign, desc: "Income categories, methods & ledger" },
  { id: "pharmacy", label: "Pharmacy Reports", icon: Pill, desc: "Inventory valuation, stock health & expiry" },
  { id: "laboratory", label: "Laboratory Reports", icon: FlaskConical, desc: "Test categories, volumes & diagnostic log" },
  { id: "staff", label: "Staff Reports", icon: UserCheck, desc: "Roster, departmental attendance & leaves" },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [tabData, setTabData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubtype, setFilterSubtype] = useState("all");

  const fetchTabData = async (tab) => {
    if (tabData[tab]) return; // cached
    setLoading(true);
    try {
      const endpoint = tab === "overview" ? "/reports/summary" : `/reports/${tab}`;
      const res = await api.get(endpoint);
      setTabData((prev) => ({ ...prev, [tab]: res.data }));
    } catch (error) {
      toast.error(`Failed to load ${tab} report data`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabData(activeTab);
    setSearchTerm("");
    setFilterSubtype("all");
  }, [activeTab]);

  const refreshCurrentTab = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "overview" ? "/reports/summary" : `/reports/${activeTab}`;
      const res = await api.get(endpoint);
      setTabData((prev) => ({ ...prev, [activeTab]: res.data }));
      toast.success("Report data refreshed");
    } catch (error) {
      toast.error("Failed to refresh report");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentData = tabData[activeTab];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
            <span className="bg-primary-50 text-primary-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
              v3.10 Suite
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            {TABS.find((t) => t.id === activeTab)?.desc}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshCurrentTab}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 text-sm py-2 px-3"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="hidden md:inline">Refresh</span>
          </button>
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2 text-sm py-2 px-4 shadow-sm">
            <Printer size={16} /> Print {TABS.find((t) => t.id === activeTab)?.label}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="print:hidden border-b border-gray-200 bg-white rounded-xl shadow-xs p-1.5 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs md:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
                isActive
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MediCare Hospital Management System</h1>
            <h2 className="text-lg font-semibold text-primary-700 mt-1">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h2>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Generated: {new Date().toLocaleString()}</p>
            <p>Official Hospital Operations Document</p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && !currentData ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
          <p className="text-sm text-gray-500">Loading {TABS.find((t) => t.id === activeTab)?.label}...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "overview" && <OverviewTab data={currentData} onSelectTab={setActiveTab} />}

          {/* TAB 2: PATIENT REPORTS */}
          {activeTab === "patients" && (
            <PatientReportsTab
              data={currentData}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterSubtype={filterSubtype}
              setFilterSubtype={setFilterSubtype}
            />
          )}

          {/* TAB 3: APPOINTMENT REPORTS */}
          {activeTab === "appointments" && (
            <AppointmentReportsTab
              data={currentData}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterSubtype={filterSubtype}
              setFilterSubtype={setFilterSubtype}
            />
          )}

          {/* TAB 4: REVENUE REPORTS */}
          {activeTab === "revenue" && (
            <RevenueReportsTab
              data={currentData}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterSubtype={filterSubtype}
              setFilterSubtype={setFilterSubtype}
            />
          )}

          {/* TAB 5: PHARMACY REPORTS */}
          {activeTab === "pharmacy" && (
            <PharmacyReportsTab
              data={currentData}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterSubtype={filterSubtype}
              setFilterSubtype={setFilterSubtype}
            />
          )}

          {/* TAB 6: LABORATORY REPORTS */}
          {activeTab === "laboratory" && (
            <LaboratoryReportsTab
              data={currentData}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterSubtype={filterSubtype}
              setFilterSubtype={setFilterSubtype}
            />
          )}

          {/* TAB 7: STAFF REPORTS */}
          {activeTab === "staff" && (
            <StaffReportsTab
              data={currentData}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterSubtype={filterSubtype}
              setFilterSubtype={setFilterSubtype}
            />
          )}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   1. OVERVIEW TAB
   ========================================================================= */
const OverviewTab = ({ data, onSelectTab }) => {
  const { summary, revenueByCategory, lowStockMedicines, patientDemographics, appointmentAnalytics } = data || {};

  const genderData = patientDemographics?.byGender?.map((g) => ({ name: g._id || "Unknown", value: g.count })) || [];
  const patientStatusData = patientDemographics?.byStatus?.map((s) => ({ name: s._id || "Unknown", value: s.count })) || [];
  const apptStatusData = appointmentAnalytics?.byStatus?.map((s) => ({ name: s._id, value: s.count })) || [];
  const apptDeptData = appointmentAnalytics?.byDepartment?.map((d) => ({ name: d._id || "Unknown", count: d.count })) || [];
  const trendData = appointmentAnalytics?.trend30Days?.map((t) => ({
    date: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    count: t.count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => onSelectTab("revenue")}
          className="card border-l-4 border-l-primary-500 cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-[11px] text-gray-400 font-semibold uppercase">Paid Revenue</p>
          <h2 className="text-xl font-extrabold text-primary-700 mt-1">
            LKR {summary?.totalRevenue?.toLocaleString()}
          </h2>
          <p className="text-[11px] text-gray-400 mt-1">Pending: LKR {summary?.totalPendingRevenue?.toLocaleString()}</p>
        </div>

        <div
          onClick={() => onSelectTab("patients")}
          className="card border-l-4 border-l-accent-500 cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-[11px] text-gray-400 font-semibold uppercase">Total Patients</p>
          <h2 className="text-xl font-extrabold text-accent-700 mt-1">{summary?.totalPatients}</h2>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Active Registry</p>
        </div>

        <div
          onClick={() => onSelectTab("appointments")}
          className="card border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-[11px] text-gray-400 font-semibold uppercase">Appointments</p>
          <h2 className="text-xl font-extrabold text-blue-700 mt-1">{summary?.totalAppointments}</h2>
          <p className="text-[11px] text-gray-400 mt-1">Across all doctors</p>
        </div>

        <div
          onClick={() => onSelectTab("pharmacy")}
          className="card border-l-4 border-l-amber-500 cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-[11px] text-gray-400 font-semibold uppercase">Medicines</p>
          <h2 className="text-xl font-extrabold text-amber-700 mt-1">{summary?.totalMedicines} Items</h2>
          <p className="text-[11px] font-semibold text-rose-600 mt-1">{summary?.lowStockCount} Low Stock</p>
        </div>

        <div
          onClick={() => onSelectTab("laboratory")}
          className="card border-l-4 border-l-emerald-500 cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-[11px] text-gray-400 font-semibold uppercase">Lab Tests</p>
          <h2 className="text-xl font-extrabold text-emerald-700 mt-1">{summary?.totalLabTests}</h2>
          <p className="text-[11px] text-gray-400 mt-1">Pending: {summary?.pendingLabTests}</p>
        </div>

        <div
          onClick={() => onSelectTab("staff")}
          className="card border-l-4 border-l-purple-500 cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-[11px] text-gray-400 font-semibold uppercase">Hospital Staff</p>
          <h2 className="text-xl font-extrabold text-purple-700 mt-1">{summary?.totalStaff}</h2>
          <p className="text-[11px] text-gray-400 mt-1">Doctors: {summary?.totalDoctors}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Patient Demographics */}
        <div className="card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Users className="text-accent-600" size={18} /> Patient Demographics — Gender
            </h3>
            <button
              onClick={() => onSelectTab("patients")}
              className="text-xs font-semibold text-primary-600 hover:underline flex items-center"
            >
              Full Report <ChevronRight size={14} />
            </button>
          </div>
          {genderData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4}>
                  {genderData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">No data</p>
          )}
        </div>

        {/* Appointments by Department */}
        <div className="card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <CalendarCheck className="text-blue-600" size={18} /> Appointments by Department
            </h3>
            <button
              onClick={() => onSelectTab("appointments")}
              className="text-xs font-semibold text-primary-600 hover:underline flex items-center"
            >
              Full Report <ChevronRight size={14} />
            </button>
          </div>
          {apptDeptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={apptDeptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <ReTooltip />
                <Bar dataKey="count" fill="#5b6df8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">No data</p>
          )}
        </div>
      </div>

      {/* Revenue Breakdown & Low Stock Alert */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <DollarSign className="text-emerald-600" size={18} /> Revenue Breakdown by Service
            </h3>
            <button
              onClick={() => onSelectTab("revenue")}
              className="text-xs font-semibold text-primary-600 hover:underline flex items-center"
            >
              Full Report <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3 pt-1">
            {Object.entries(revenueByCategory || {}).map(([cat, amt]) => {
              const total = summary?.totalRevenue || 1;
              const pct = Math.round((amt / total) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>{cat} Services</span>
                    <span>LKR {amt.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="text-amber-600" size={18} /> Urgent Low Stock Reorder Alerts
            </h3>
            <button
              onClick={() => onSelectTab("pharmacy")}
              className="text-xs font-semibold text-primary-600 hover:underline flex items-center"
            >
              Full Report <ChevronRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
            {lowStockMedicines?.map((m) => (
              <div key={m.id} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-gray-800">{m.name}</p>
                  <p className="text-[11px] text-gray-400">Batch: {m.batchNumber} · Min: {m.minStockLevel}</p>
                </div>
                <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold text-xs">
                  {m.quantityInStock} left
                </span>
              </div>
            ))}
            {!lowStockMedicines?.length && (
              <p className="text-gray-400 text-center py-6 text-xs">All medicines are at healthy stock levels.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   2. PATIENT REPORTS TAB
   ========================================================================= */
const PatientReportsTab = ({ data, searchTerm, setSearchTerm, filterSubtype, setFilterSubtype }) => {
  const { metrics, genderData, ageGroupData, bloodGroupData, registrationTrend, patients } = data || {};

  const filteredPatients = (patients || []).filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterSubtype === "all" || p.status === filterSubtype;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Patient KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-accent-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Total Registered</p>
          <h2 className="text-2xl font-black text-accent-700 mt-1">{metrics?.total || 0}</h2>
          <p className="text-xs text-gray-400 mt-1">All-time patient files</p>
        </div>
        <div className="card border-l-4 border-l-emerald-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Active Outpatients</p>
          <h2 className="text-2xl font-black text-emerald-700 mt-1">{metrics?.active || 0}</h2>
          <p className="text-xs text-emerald-600 mt-1">Receiving active care</p>
        </div>
        <div className="card border-l-4 border-l-blue-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Admitted Inpatients</p>
          <h2 className="text-2xl font-black text-blue-700 mt-1">{metrics?.admitted || 0}</h2>
          <p className="text-xs text-blue-600 mt-1">Occupying hospital beds</p>
        </div>
        <div className="card border-l-4 border-l-purple-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">New Patients (This Month)</p>
          <h2 className="text-2xl font-black text-purple-700 mt-1">{metrics?.newThisMonth || 0}</h2>
          <p className="text-xs text-gray-400 mt-1">Recent registrations</p>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Gender Breakdown */}
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Users size={16} className="text-primary-600" /> Gender Demographics
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={genderData || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65}>
                {(genderData || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <ReTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Age Groups */}
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Activity size={16} className="text-emerald-600" /> Age Distribution
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ageGroupData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <ReTooltip />
              <Bar dataKey="count" fill="#20a570" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Blood Groups */}
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600" /> Blood Group Records
          </h3>
          <div className="grid grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto">
            {(bloodGroupData || []).map((bg) => (
              <div key={bg.name} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                <span className="font-bold text-rose-700 text-xs">{bg.name}</span>
                <span className="font-extrabold text-gray-700 text-xs">{bg.count} patients</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Patient Register Table */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-800">Official Patient Registry</h3>
            <p className="text-xs text-gray-400">Detailed list of registered patients, contacts, and clinical statuses</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto print:hidden">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Search patient name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-8 text-xs py-1.5"
              />
            </div>
            <select
              value={filterSubtype}
              onChange={(e) => setFilterSubtype(e.target.value)}
              className="input text-xs py-1.5 w-32"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Admitted">Admitted</option>
              <option value="Discharged">Discharged</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
              <tr>
                <th className="p-3">Patient ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Age / Gender</th>
                <th className="p-3">Blood Group</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Emergency Contact</th>
                <th className="p-3">Status</th>
                <th className="p-3">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPatients.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60">
                  <td className="p-3 font-mono font-semibold text-gray-600">PT-{p.id}</td>
                  <td className="p-3 font-bold text-gray-900">{p.name}</td>
                  <td className="p-3 text-gray-600">{p.age} yrs · {p.gender}</td>
                  <td className="p-3">
                    <span className="bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded text-[11px]">
                      {p.bloodGroup || "N/A"}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{p.phone}</td>
                  <td className="p-3 text-gray-500">{p.emergencyContact || "—"}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        p.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : p.status === "Admitted"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400">
                    {p.registeredAt ? new Date(p.registeredAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
              {!filteredPatients.length && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    No matching patient records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   3. APPOINTMENT REPORTS TAB
   ========================================================================= */
const AppointmentReportsTab = ({ data, searchTerm, setSearchTerm, filterSubtype, setFilterSubtype }) => {
  const { metrics, statusData, departmentData, doctorWorkload, trend30Days, appointments } = data || {};

  const filteredAppointments = (appointments || []).filter((a) => {
    const matchSearch =
      a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterSubtype === "all" || a.status === filterSubtype;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="card border-l-4 border-l-blue-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Total Bookings</p>
          <h2 className="text-2xl font-black text-blue-700 mt-1">{metrics?.total || 0}</h2>
          <p className="text-xs text-gray-400 mt-1">All appointments</p>
        </div>
        <div className="card border-l-4 border-l-emerald-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Completed</p>
          <h2 className="text-2xl font-black text-emerald-700 mt-1">{metrics?.completed || 0}</h2>
          <p className="text-xs text-emerald-600 mt-1">{metrics?.completionRate || 0}% Completion Rate</p>
        </div>
        <div className="card border-l-4 border-l-primary-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Confirmed</p>
          <h2 className="text-2xl font-black text-primary-700 mt-1">{metrics?.confirmed || 0}</h2>
          <p className="text-xs text-primary-600 mt-1">Upcoming sessions</p>
        </div>
        <div className="card border-l-4 border-l-amber-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Pending</p>
          <h2 className="text-2xl font-black text-amber-700 mt-1">{metrics?.pending || 0}</h2>
          <p className="text-xs text-amber-600 mt-1">Awaiting approval</p>
        </div>
        <div className="card border-l-4 border-l-rose-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Cancelled</p>
          <h2 className="text-2xl font-black text-rose-700 mt-1">{metrics?.cancelled || 0}</h2>
          <p className="text-xs text-rose-600 mt-1">No-show / cancelled</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <PieChart size={16} className="text-primary-600" /> Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65}>
                {(statusData || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <ReTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-600" /> By Department
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={departmentData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <ReTooltip />
              <Bar dataKey="count" fill="#5b6df8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Stethoscope size={16} className="text-purple-600" /> Doctor Workload
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pt-1">
            {(doctorWorkload || []).map((doc) => (
              <div key={doc.doctor_name} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                <div>
                  <p className="font-bold text-gray-800">{doc.doctor_name}</p>
                  <p className="text-[10px] text-gray-400">{doc.department}</p>
                </div>
                <span className="font-extrabold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                  {doc.count} visits
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Appointment History Table */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-800">Appointment Clinical Log</h3>
            <p className="text-xs text-gray-400">Complete schedule of patient consultations and doctor allocations</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto print:hidden">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Search patient, doctor, dept..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-8 text-xs py-1.5"
              />
            </div>
            <select
              value={filterSubtype}
              onChange={(e) => setFilterSubtype(e.target.value)}
              className="input text-xs py-1.5 w-32"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
              <tr>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Doctor</th>
                <th className="p-3">Department</th>
                <th className="p-3">Reason / Chief Complaint</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAppointments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/60">
                  <td className="p-3 font-semibold text-gray-800">
                    {a.date ? new Date(a.date).toLocaleDateString() : "—"} · {a.time}
                  </td>
                  <td className="p-3 font-bold text-gray-900">
                    {a.patientName}
                    <p className="text-[11px] font-normal text-gray-400">{a.patientPhone}</p>
                  </td>
                  <td className="p-3 text-gray-800 font-medium">{a.doctorName}</td>
                  <td className="p-3">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px]">
                      {a.department}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600 max-w-xs truncate">{a.reason || "General Consultation"}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        a.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : a.status === "Confirmed"
                          ? "bg-blue-50 text-blue-700"
                          : a.status === "Pending"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!filteredAppointments.length && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No matching appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   4. REVENUE REPORTS TAB
   ========================================================================= */
const RevenueReportsTab = ({ data, searchTerm, setSearchTerm, filterSubtype, setFilterSubtype }) => {
  const { metrics, categoryData, paymentMethodData, monthlyTrend, ledger } = data || {};

  const filteredLedger = (ledger || []).filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterSubtype === "all" || inv.status === filterSubtype;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-primary-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Total Invoiced Billed</p>
          <h2 className="text-2xl font-black text-primary-700 mt-1">
            LKR {metrics?.totalBilled?.toLocaleString() || 0}
          </h2>
          <p className="text-xs text-gray-400 mt-1">{metrics?.invoiceCount || 0} total invoices</p>
        </div>
        <div className="card border-l-4 border-l-emerald-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Collected Revenue (Paid)</p>
          <h2 className="text-2xl font-black text-emerald-700 mt-1">
            LKR {metrics?.totalPaid?.toLocaleString() || 0}
          </h2>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            {metrics?.collectionRate || 0}% Collection Efficiency
          </p>
        </div>
        <div className="card border-l-4 border-l-rose-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Outstanding Receivables</p>
          <h2 className="text-2xl font-black text-rose-700 mt-1">
            LKR {metrics?.totalPending?.toLocaleString() || 0}
          </h2>
          <p className="text-xs text-rose-600 mt-1">{metrics?.pendingCount || 0} invoices pending</p>
        </div>
        <div className="card border-l-4 border-l-amber-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Settlement Breakdown</p>
          <h2 className="text-xl font-black text-gray-800 mt-1">
            {metrics?.paidCount} Paid / {metrics?.partialCount} Partial
          </h2>
          <p className="text-xs text-gray-400 mt-1">Invoice settlement ratio</p>
        </div>
      </div>

      {/* Revenue Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 size={16} className="text-primary-600" /> Revenue by Service Category
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <ReTooltip formatter={(val) => `LKR ${Number(val).toLocaleString()}`} />
              <Bar dataKey="amount" fill="#5b6df8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-600" /> Payment Methods Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={paymentMethodData || []} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                {(paymentMethodData || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <ReTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Billing Ledger */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-800">Financial Invoicing Ledger</h3>
            <p className="text-xs text-gray-400">Auditable statement of patient bills, payment methods, and balances</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto print:hidden">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Search invoice, patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-8 text-xs py-1.5"
              />
            </div>
            <select
              value={filterSubtype}
              onChange={(e) => setFilterSubtype(e.target.value)}
              className="input text-xs py-1.5 w-32"
            >
              <option value="all">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Date</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Total Billed</th>
                <th className="p-3">Paid Amount</th>
                <th className="p-3">Balance</th>
                <th className="p-3">Method</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLedger.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/60">
                  <td className="p-3 font-mono font-bold text-gray-700">{b.invoiceNumber}</td>
                  <td className="p-3 text-gray-500">
                    {b.date ? new Date(b.date).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3 font-bold text-gray-900">{b.patientName}</td>
                  <td className="p-3 font-semibold text-gray-800">LKR {b.totalAmount?.toLocaleString()}</td>
                  <td className="p-3 font-semibold text-emerald-700">LKR {b.paidAmount?.toLocaleString()}</td>
                  <td className="p-3 font-semibold text-rose-600">
                    {b.balance > 0 ? `LKR ${b.balance?.toLocaleString()}` : "—"}
                  </td>
                  <td className="p-3">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-medium">
                      {b.paymentMethod}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        b.status === "Paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : b.status === "Partial"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!filteredLedger.length && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    No matching invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   5. PHARMACY REPORTS TAB
   ========================================================================= */
const PharmacyReportsTab = ({ data, searchTerm, setSearchTerm, filterSubtype, setFilterSubtype }) => {
  const { metrics, stockHealthData, categoryValuation, lowStockList, expiryList } = data || {};
  const [subView, setSubView] = useState("lowStock"); // "lowStock" or "expiry"

  const filteredLowStock = (lowStockList || []).filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredExpiry = (expiryList || []).filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Pharmacy KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="card border-l-4 border-l-amber-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Total Catalog Items</p>
          <h2 className="text-2xl font-black text-amber-700 mt-1">{metrics?.totalMedicines || 0}</h2>
          <p className="text-xs text-gray-400 mt-1">{metrics?.totalStockUnits?.toLocaleString() || 0} total units</p>
        </div>
        <div className="card border-l-4 border-l-emerald-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Inventory Asset Value</p>
          <h2 className="text-2xl font-black text-emerald-700 mt-1">
            LKR {metrics?.totalValuation?.toLocaleString() || 0}
          </h2>
          <p className="text-xs text-emerald-600 mt-1">Total in-stock valuation</p>
        </div>
        <div className="card border-l-4 border-l-rose-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Low Stock Alerts</p>
          <h2 className="text-2xl font-black text-rose-700 mt-1">{metrics?.lowStockCount || 0}</h2>
          <p className="text-xs text-rose-600 font-semibold mt-1">Requires urgent reorder</p>
        </div>
        <div className="card border-l-4 border-l-purple-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Out of Stock</p>
          <h2 className="text-2xl font-black text-purple-700 mt-1">{metrics?.outOfStockCount || 0}</h2>
          <p className="text-xs text-gray-400 mt-1">Zero units remaining</p>
        </div>
        <div className="card border-l-4 border-l-coral-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Near Expiry (&lt;30d)</p>
          <h2 className="text-2xl font-black text-rose-600 mt-1">{metrics?.expiringSoonCount || 0}</h2>
          <p className="text-xs text-gray-400 mt-1">{metrics?.expiredCount || 0} already expired</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <PieChart size={16} className="text-primary-600" /> Stock Health Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stockHealthData || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                {(stockHealthData || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <ReTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 size={16} className="text-emerald-600" /> Valuation by Category (LKR)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryValuation || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <ReTooltip formatter={(val) => `LKR ${Number(val).toLocaleString()}`} />
              <Bar dataKey="valuation" fill="#20a570" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sub-view switcher */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSubView("lowStock")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                subView === "lowStock"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              ⚠️ Low Stock & Reorder Report ({lowStockList?.length || 0})
            </button>
            <button
              onClick={() => setSubView("expiry")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                subView === "expiry"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              📅 Expiry Monitoring Schedule ({expiryList?.length || 0})
            </button>
          </div>

          <div className="relative w-full sm:w-60 print:hidden">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Search medicine name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-8 text-xs py-1.5"
            />
          </div>
        </div>

        {subView === "lowStock" ? (
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Medicine Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Batch #</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3">Min Level</th>
                  <th className="p-3">Unit Price</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLowStock.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/60">
                    <td className="p-3 font-bold text-gray-900">{m.name}</td>
                    <td className="p-3 text-gray-600">{m.category}</td>
                    <td className="p-3 font-mono text-gray-500">{m.batchNumber}</td>
                    <td className="p-3">
                      <span className="bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded text-[11px]">
                        {m.quantityInStock} units
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-gray-700">{m.minStockLevel}</td>
                    <td className="p-3 font-semibold text-gray-800">LKR {m.unitPrice}</td>
                    <td className="p-3 text-gray-500">{m.expiryDate}</td>
                    <td className="p-3 text-gray-400">{m.location || "Main Pharmacy"}</td>
                  </tr>
                ))}
                {!filteredLowStock.length && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      All inventory stock levels are adequate.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Medicine Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Batch #</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Unit Price</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Expiry Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpiry.map((m) => {
                  const isExpired = m.daysUntilExpiry < 0;
                  const isUrgent = m.daysUntilExpiry >= 0 && m.daysUntilExpiry <= 30;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/60">
                      <td className="p-3 font-bold text-gray-900">{m.name}</td>
                      <td className="p-3 text-gray-600">{m.category}</td>
                      <td className="p-3 font-mono text-gray-500">{m.batchNumber}</td>
                      <td className="p-3 font-semibold text-gray-800">{m.quantityInStock}</td>
                      <td className="p-3 text-gray-700">LKR {m.unitPrice}</td>
                      <td className="p-3 font-semibold text-gray-800">{m.expiryDate}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isExpired
                              ? "bg-rose-100 text-rose-800"
                              : isUrgent
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {isExpired
                            ? "EXPIRED"
                            : isUrgent
                            ? `Expires in ${m.daysUntilExpiry} days`
                            : `Valid (${m.daysUntilExpiry} days left)`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!filteredExpiry.length && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No expiry records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   6. LABORATORY REPORTS TAB
   ========================================================================= */
const LaboratoryReportsTab = ({ data, searchTerm, setSearchTerm, filterSubtype, setFilterSubtype }) => {
  const { metrics, categoryData, statusData, tests } = data || {};

  const filteredTests = (tests || []).filter((t) => {
    const matchSearch =
      t.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterSubtype === "all" || t.status === filterSubtype;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Lab KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="card border-l-4 border-l-emerald-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Total Diagnostic Tests</p>
          <h2 className="text-2xl font-black text-emerald-700 mt-1">{metrics?.totalTests || 0}</h2>
          <p className="text-xs text-gray-400 mt-1">Processed in lab</p>
        </div>
        <div className="card border-l-4 border-l-blue-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Completed & Verified</p>
          <h2 className="text-2xl font-black text-blue-700 mt-1">{metrics?.completedTests || 0}</h2>
          <p className="text-xs text-blue-600 mt-1">{metrics?.completionRate || 0}% Completion Rate</p>
        </div>
        <div className="card border-l-4 border-l-amber-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Pending Samples</p>
          <h2 className="text-2xl font-black text-amber-700 mt-1">{metrics?.pendingTests || 0}</h2>
          <p className="text-xs text-amber-600 mt-1">Awaiting analysis</p>
        </div>
        <div className="card border-l-4 border-l-purple-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">In Progress</p>
          <h2 className="text-2xl font-black text-purple-700 mt-1">{metrics?.inProgressTests || 0}</h2>
          <p className="text-xs text-purple-600 mt-1">Active lab processing</p>
        </div>
        <div className="card border-l-4 border-l-primary-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Lab Billings Value</p>
          <h2 className="text-2xl font-black text-primary-700 mt-1">
            LKR {metrics?.labRevenue?.toLocaleString() || 0}
          </h2>
          <p className="text-xs text-gray-400 mt-1">Completed tests revenue</p>
        </div>
      </div>

      {/* Diagnostic Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 size={16} className="text-emerald-600" /> Tests by Category
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <ReTooltip />
              <Bar dataKey="count" fill="#20a570" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <PieChart size={16} className="text-blue-600" /> Diagnostic Status Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                {(statusData || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <ReTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Laboratory Audit Log */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-800">Laboratory Testing Audit Log</h3>
            <p className="text-xs text-gray-400">Clinical test orders, specimen results, and completion records</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto print:hidden">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Search test, patient, doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-8 text-xs py-1.5"
              />
            </div>
            <select
              value={filterSubtype}
              onChange={(e) => setFilterSubtype(e.target.value)}
              className="input text-xs py-1.5 w-32"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Requested">Requested</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
              <tr>
                <th className="p-3">Test Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Doctor</th>
                <th className="p-3">Requested</th>
                <th className="p-3">Result / Normal Range</th>
                <th className="p-3">Cost</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTests.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/60">
                  <td className="p-3 font-bold text-gray-900">{t.testName}</td>
                  <td className="p-3">
                    <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                      {t.category}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-gray-800">{t.patientName}</td>
                  <td className="p-3 text-gray-600">{t.doctorName}</td>
                  <td className="p-3 text-gray-500">
                    {t.requestedDate ? new Date(t.requestedDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3">
                    {t.resultValue ? (
                      <span className="font-semibold text-gray-800">
                        {t.resultValue} {t.unit} <span className="text-gray-400 font-normal">({t.normalRange})</span>
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Pending analysis</span>
                    )}
                  </td>
                  <td className="p-3 font-semibold text-gray-800">LKR {t.cost?.toLocaleString()}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        t.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : t.status === "In Progress"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!filteredTests.length && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-400">
                    No matching laboratory test records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   7. STAFF REPORTS TAB
   ========================================================================= */
const StaffReportsTab = ({ data, searchTerm, setSearchTerm, filterSubtype, setFilterSubtype }) => {
  const { metrics, departmentDistribution, roleDistribution, staffRoster, recentLeaves } = data || {};
  const [staffSubView, setStaffSubView] = useState("roster"); // "roster" or "leaves"

  const filteredStaff = (staffRoster || []).filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = filterSubtype === "all" || s.department === filterSubtype;
    return matchSearch && matchDept;
  });

  const uniqueDepartments = Array.from(new Set((staffRoster || []).map((s) => s.department))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Staff KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="card border-l-4 border-l-purple-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Total Workforce</p>
          <h2 className="text-2xl font-black text-purple-700 mt-1">{metrics?.totalStaff || 0}</h2>
          <p className="text-xs text-gray-400 mt-1">{metrics?.activeStaff || 0} active employees</p>
        </div>
        <div className="card border-l-4 border-l-emerald-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Today's Attendance</p>
          <h2 className="text-2xl font-black text-emerald-700 mt-1">{metrics?.todayAttendanceRate || 0}%</h2>
          <p className="text-xs text-emerald-600 mt-1">
            {metrics?.todayPresent || 0} Present · {metrics?.todayAbsent || 0} Absent
          </p>
        </div>
        <div className="card border-l-4 border-l-blue-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Departments</p>
          <h2 className="text-2xl font-black text-blue-700 mt-1">{metrics?.departmentCount || 0}</h2>
          <p className="text-xs text-gray-400 mt-1">Hospital divisions</p>
        </div>
        <div className="card border-l-4 border-l-primary-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Monthly Payroll Cost</p>
          <h2 className="text-2xl font-black text-primary-700 mt-1">
            LKR {metrics?.monthlyPayroll?.toLocaleString() || 0}
          </h2>
          <p className="text-xs text-gray-400 mt-1">Active staff salary total</p>
        </div>
        <div className="card border-l-4 border-l-amber-500">
          <p className="text-xs text-gray-400 font-semibold uppercase">Leaves Logged</p>
          <h2 className="text-2xl font-black text-amber-700 mt-1">{metrics?.totalLeavesLogged || 0}</h2>
          <p className="text-xs text-amber-600 mt-1">Recorded leave requests</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 size={16} className="text-purple-600" /> Staff Distribution by Department
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={departmentDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <ReTooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <PieChart size={16} className="text-primary-600" /> Staff Distribution by Role
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={roleDistribution || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                {(roleDistribution || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <ReTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Staff Roster / Leaves Switcher */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStaffSubView("roster")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                staffSubView === "roster"
                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              👥 Staff Attendance & Roster ({staffRoster?.length || 0})
            </button>
            <button
              onClick={() => setStaffSubView("leaves")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                staffSubView === "leaves"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              📋 Leave Requests History ({recentLeaves?.length || 0})
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto print:hidden">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Search staff, ID, role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-8 text-xs py-1.5"
              />
            </div>
            {staffSubView === "roster" && (
              <select
                value={filterSubtype}
                onChange={(e) => setFilterSubtype(e.target.value)}
                className="input text-xs py-1.5 w-36"
              >
                <option value="all">All Departments</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {staffSubView === "roster" ? (
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Staff ID</th>
                  <th className="p-3">Employee Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Today's Status</th>
                  <th className="p-3">Attendance Rate</th>
                  <th className="p-3">Monthly Salary</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStaff.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/60">
                    <td className="p-3 font-mono font-bold text-gray-600">{s.employeeId}</td>
                    <td className="p-3 font-bold text-gray-900">
                      {s.name}
                      <p className="text-[11px] font-normal text-gray-400">{s.email}</p>
                    </td>
                    <td className="p-3 font-medium text-gray-800">{s.role}</td>
                    <td className="p-3">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px]">
                        {s.department}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          s.todayStatus === "Present"
                            ? "bg-emerald-50 text-emerald-700"
                            : s.todayStatus === "Late"
                            ? "bg-amber-50 text-amber-700"
                            : s.todayStatus === "Absent"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {s.todayStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-800">{s.attendanceRate}%</span>
                        <div className="w-12 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              s.attendanceRate >= 80 ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${s.attendanceRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-gray-800">LKR {s.salary?.toLocaleString()}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          s.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!filteredStaff.length && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      No matching staff records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Leave Type</th>
                  <th className="p-3">Duration (From - To)</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(recentLeaves || []).map((l, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/60">
                    <td className="p-3 font-bold text-gray-900">
                      {l.staffName}
                      <span className="block font-mono text-[10px] text-gray-400">{l.employeeId}</span>
                    </td>
                    <td className="p-3 text-gray-600">{l.department}</td>
                    <td className="p-3">
                      <span className="bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                        {l.type} Leave
                      </span>
                    </td>
                    <td className="p-3 font-medium text-gray-800">
                      {l.from} to {l.to}
                    </td>
                    <td className="p-3 text-gray-600 max-w-xs truncate">{l.reason || "—"}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          l.status === "Approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : l.status === "Pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!recentLeaves?.length && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      No leave requests recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
