import React, { useEffect, useState } from "react";
import { Plus, Search, UserCheck, Calendar, DollarSign, Briefcase, Mail, Phone, CheckCircle2, XCircle, Clock, History, Trash2 } from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import toast from "react-hot-toast";

const Staff = () => {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedStaffForHistory, setSelectedStaffForHistory] = useState(null);

    // Leave Management State
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [selectedStaffForLeave, setSelectedStaffForLeave] = useState(null);
    const [leaveForm, setLeaveForm] = useState({
        leaveType: "Casual Leave",
        startDate: new Date().toLocaleDateString("en-CA"),
        endDate: new Date().toLocaleDateString("en-CA"),
        reason: "",
        status: "Approved",
    });

    const [form, setForm] = useState({
        name: "",
        role: "Nurse",
        department: "ICU",
        email: "",
        phone: "",
        salary: 40000,
        status: "Active",
    });

    const fetchStaff = async (q = "") => {
        setLoading(true);
        try {
            const { data } = await api.get(`/staff${q ? `?search=${q}` : ""}`);
            const list = Array.isArray(data) ? data : (Array.isArray(data?.staff) ? data.staff : []);
            setStaffList(list);
        } catch (error) {
            setStaffList([]);
            toast.error(error.friendlyMessage || "Failed to load staff list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || form.name.trim().length < 2) {
            return toast.error("Please enter a valid full name (at least 2 characters).");
        }
        const rawDigits = (form.phone || "").replace(/\D/g, "");
        if (!form.phone || !form.phone.trim()) {
            return toast.error("Phone number is required.");
        }
        if (rawDigits.length !== 10) {
            return toast.error("Phone number must be exactly 10 digits (e.g. 0705552733).");
        }
        if (!form.email || !form.email.includes("@") || !form.email.includes(".")) {
            return toast.error("Please enter a complete and valid email address (e.g. name@gmail.com).");
        }
        try {
            await api.post("/staff", {
                ...form,
                phone: rawDigits,
                salary: Number(form.salary) || 0,
            });
            toast.success("Employee registered successfully!");
            setModalOpen(false);
            setForm({
                name: "",
                role: "Nurse",
                department: "ICU",
                email: "",
                phone: "",
                salary: 40000,
                status: "Active",
            });
            fetchStaff(search);
        } catch (error) {
            toast.error(error.friendlyMessage || error.response?.data?.message || "Failed to add employee");
        }
    };

    const handleAttendance = async (staffId, status) => {
        try {
            const todayDate = new Date().toLocaleDateString("en-CA");
            const res = await api.post(`/staff/${staffId}/attendance`, { status, date: todayDate });
            toast.success(res.data.message || `Marked attendance: ${status}`);
            fetchStaff(search);
        } catch (error) {
            toast.error(error.response?.data?.message || "Attendance update failed");
        }
    };

    const openLeaveModal = (staff) => {
        setSelectedStaffForLeave(staff);
        const today = new Date().toLocaleDateString("en-CA");
        setLeaveForm({
            leaveType: "Casual Leave",
            startDate: today,
            endDate: today,
            reason: "",
            status: "Approved",
        });
        setLeaveModalOpen(true);
    };

    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStaffForLeave) return;
        try {
            const staffId = selectedStaffForLeave._id || selectedStaffForLeave.id;
            const res = await api.post(`/staff/${staffId}/leave`, leaveForm);
            toast.success(res.data.message || "Leave recorded successfully");
            fetchStaff(search);
            if (res.data.staff) {
                setSelectedStaffForLeave(res.data.staff);
            }
            setLeaveForm({
                leaveType: "Casual Leave",
                startDate: new Date().toLocaleDateString("en-CA"),
                endDate: new Date().toLocaleDateString("en-CA"),
                reason: "",
                status: "Approved",
            });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to record leave");
        }
    };

    const handleDeleteLeave = async (leaveId) => {
        if (!confirm("Delete this leave record?")) return;
        try {
            const staffId = selectedStaffForLeave._id || selectedStaffForLeave.id;
            const res = await api.delete(`/staff/${staffId}/leave/${leaveId}`);
            toast.success("Leave record removed");
            fetchStaff(search);
            if (res.data.staff) {
                setSelectedStaffForLeave(res.data.staff);
            }
        } catch (error) {
            toast.error("Failed to delete leave");
        }
    };

    const safeStaffList = Array.isArray(staffList) ? staffList : [];
    const filteredStaff = safeStaffList.filter((s) => {
        if (!s) return false;
        const name = s.name ? s.name.toLowerCase() : "";
        const dept = s.department ? s.department.toLowerCase() : "";
        const role = s.role ? s.role.toLowerCase() : "";
        const q = (search || "").toLowerCase();
        return name.includes(q) || dept.includes(q) || role.includes(q);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Staff & Employee Management</h1>
                    <p className="text-gray-500">Manage hospital staff records, attendance, departments, and payroll details.</p>
                </div>
                <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 w-fit">
                    <Plus size={18} /> Register New Employee
                </button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                    className="input-field pl-10"
                    placeholder="Search staff by name, role, department..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredStaff.map((s) => (
                        <div key={s._id} className="card hover:shadow-md transition-shadow flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                                            {s.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{s.name}</h3>
                                            <p className="text-xs text-primary-600 font-semibold">{s.role} · {s.department}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <Badge status={s.status} />
                                        <button
                                            type="button"
                                            onClick={() => openLeaveModal(s)}
                                            className="text-[11px] font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 px-2.5 py-0.5 rounded-lg border border-primary-200/70 transition flex items-center gap-1 shadow-2xs"
                                            title="View & Apply Leaves"
                                        >
                                            <Calendar size={11} /> Leaves ({(s.leaves || []).length})
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5 text-xs text-gray-500 my-4 bg-gray-50 p-3 rounded-xl">
                                    <p className="flex items-center gap-2"><Briefcase size={14} /> ID: <span className="font-mono font-bold text-gray-700">{s.employeeId}</span></p>
                                    <p className="flex items-center gap-2"><Phone size={14} /> {s.phone}</p>
                                    <p className="flex items-center gap-2"><Mail size={14} /> {s.email}</p>
                                    <p className="flex items-center gap-2"><DollarSign size={14} /> Salary: LKR {s.salary?.toLocaleString()}</p>
                                </div>

                                {(() => {
                                    const todayLocal = new Date().toLocaleDateString("en-CA");
                                    const todayUTC = new Date().toISOString().split("T")[0];
                                    const todayAttendance = (s.attendance || []).find((a) => a.date === todayLocal || a.date === todayUTC);
                                    const todayStatus = todayAttendance?.status;
                                    const totalDays = (s.attendance || []).length;

                                    return (
                                        <>
                                            <div className="mt-3 mb-2 p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 text-xs flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-gray-400 font-medium">Today:</span>
                                                    {todayStatus === "Present" && (
                                                        <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                                                            <CheckCircle2 size={12} className="text-emerald-600" /> Present
                                                        </span>
                                                    )}
                                                    {todayStatus === "Absent" && (
                                                        <span className="inline-flex items-center gap-1 font-bold text-red-800 bg-red-100/80 px-2 py-0.5 rounded-md border border-red-200">
                                                            <XCircle size={12} className="text-red-600" /> Absent
                                                        </span>
                                                    )}
                                                    {!todayStatus && (
                                                        <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                                            <Clock size={12} className="text-gray-400" /> Not Marked
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedStaffForHistory(s);
                                                        setHistoryModalOpen(true);
                                                    }}
                                                    className="text-[11px] font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1 hover:underline"
                                                    title="View saved attendance log"
                                                >
                                                    <History size={12} /> Log ({totalDays})
                                                </button>
                                            </div>

                                            <div className="pt-2 border-t border-gray-100 flex gap-2">
                                                <button
                                                    onClick={() => handleAttendance(s._id || s.id, "Present")}
                                                    className={`flex-1 text-xs font-semibold py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                                                        todayStatus === "Present"
                                                            ? "bg-emerald-600 text-white shadow-sm font-bold ring-2 ring-emerald-500/20"
                                                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                                                    }`}
                                                >
                                                    <CheckCircle2 size={13} /> {todayStatus === "Present" ? "Marked Present" : "Mark Present"}
                                                </button>
                                                <button
                                                    onClick={() => handleAttendance(s._id || s.id, "Absent")}
                                                    className={`flex-1 text-xs font-semibold py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                                                        todayStatus === "Absent"
                                                            ? "bg-red-600 text-white shadow-sm font-bold ring-2 ring-red-500/20"
                                                            : "bg-red-50 hover:bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    <XCircle size={13} /> {todayStatus === "Absent" ? "Marked Absent" : "Mark Absent"}
                                                </button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    ))}
                    {!filteredStaff.length && (
                        <p className="text-gray-400 text-center col-span-full py-16">No staff records found.</p>
                    )}
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register New Employee">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label-field">Full Name</label>
                        <input
                            required
                            className="input-field"
                            placeholder="e.g. Sister Mary Gomez"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-field">Role</label>
                            <select
                                className="input-field"
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                            >
                                <option>Nurse</option>
                                <option>Receptionist</option>
                                <option>Lab Tech</option>
                                <option>Pharmacist</option>
                                <option>Accountant</option>
                                <option>Admin</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-field">Department</label>
                            <input
                                required
                                className="input-field"
                                placeholder="ICU / Pathology"
                                value={form.department}
                                onChange={(e) => setForm({ ...form, department: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-field">Phone (10 Digits)</label>
                            <input
                                required
                                className="input-field"
                                maxLength={14}
                                placeholder="e.g. 0712345678"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label-field">Email</label>
                            <input
                                type="email"
                                required
                                className="input-field"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="label-field">Monthly Salary (LKR)</label>
                        <input
                            type="number"
                            required
                            className="input-field"
                            value={form.salary}
                            onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
                        />
                    </div>
                    <button type="submit" className="btn-primary w-full">
                        Save Employee
                    </button>
                </form>
            </Modal>

            {/* Modal: Attendance History */}
            <Modal
                isOpen={historyModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                title={selectedStaffForHistory ? `Attendance Log — ${selectedStaffForHistory.name}` : "Attendance History"}
            >
                {selectedStaffForHistory && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-3.5 rounded-xl text-xs space-y-1 border border-gray-100">
                            <div className="flex justify-between font-medium">
                                <span className="text-gray-500">Employee ID:</span>
                                <span className="font-mono font-bold text-gray-800">{selectedStaffForHistory.employeeId}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                                <span className="text-gray-500">Role & Department:</span>
                                <span className="font-bold text-gray-800">{selectedStaffForHistory.role} · {selectedStaffForHistory.department}</span>
                            </div>
                        </div>

                        {/* Attendance Statistics */}
                        {(() => {
                            const records = selectedStaffForHistory.attendance || [];
                            const presentCount = records.filter(r => r.status === "Present").length;
                            const absentCount = records.filter(r => r.status === "Absent").length;
                            const rate = records.length ? Math.round((presentCount / records.length) * 100) : 0;

                            return (
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                                        <p className="text-emerald-700 font-bold text-lg">{presentCount}</p>
                                        <p className="text-[10px] text-emerald-600 uppercase font-semibold">Days Present</p>
                                    </div>
                                    <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl">
                                        <p className="text-red-700 font-bold text-lg">{absentCount}</p>
                                        <p className="text-[10px] text-red-600 uppercase font-semibold">Days Absent</p>
                                    </div>
                                    <div className="p-2.5 bg-primary-50 border border-primary-100 rounded-xl">
                                        <p className="text-primary-700 font-bold text-lg">{rate}%</p>
                                        <p className="text-[10px] text-primary-600 uppercase font-semibold">Attendance Rate</p>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Records List */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Historical Saved Logs</h4>
                            {(!selectedStaffForHistory.attendance || selectedStaffForHistory.attendance.length === 0) ? (
                                <p className="text-xs text-gray-400 text-center py-6">No attendance records logged yet for this employee.</p>
                            ) : (
                                <div className="max-h-60 overflow-y-auto space-y-1.5 border border-gray-100 rounded-xl p-2 bg-gray-50/50">
                                    {selectedStaffForHistory.attendance.map((entry, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-gray-100 shadow-2xs">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={13} className="text-gray-400" />
                                                <span className="font-semibold text-gray-800">
                                                    {new Date(entry.date).toLocaleDateString(undefined, {
                                                        weekday: "short",
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </span>
                                            </div>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                                    entry.status === "Present"
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        : "bg-red-50 text-red-700 border border-red-200"
                                                }`}
                                            >
                                                {entry.status === "Present" ? "✓ Present" : "✗ Absent"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setHistoryModalOpen(false)}
                                className="btn-secondary text-xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal: Leave Management */}
            <Modal
                isOpen={leaveModalOpen}
                onClose={() => setLeaveModalOpen(false)}
                title={selectedStaffForLeave ? `Leave Records — ${selectedStaffForLeave.name}` : "Leave Records"}
                size="lg"
            >
                {selectedStaffForLeave && (
                    <div className="space-y-5">
                        <div className="bg-gray-50 p-3.5 rounded-xl text-xs space-y-1 border border-gray-100 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-gray-800 text-sm">{selectedStaffForLeave.name}</p>
                                <p className="text-gray-500 font-mono">ID: {selectedStaffForLeave.employeeId} · {selectedStaffForLeave.role} ({selectedStaffForLeave.department})</p>
                            </div>
                            <div className="text-right">
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary-700 border border-primary-100">
                                    {(selectedStaffForLeave.leaves || []).length} Leave Record(s)
                                </span>
                            </div>
                        </div>

                        {/* Leave Application Form */}
                        <form onSubmit={handleLeaveSubmit} className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-3 text-xs">
                            <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Record / Grant Leave</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="label-field">Leave Type</label>
                                    <select
                                        className="input-field"
                                        value={leaveForm.leaveType}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                                        required
                                    >
                                        <option>Casual Leave</option>
                                        <option>Sick Leave</option>
                                        <option>Annual Leave</option>
                                        <option>Maternity / Paternity</option>
                                        <option>Unpaid Leave</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label-field">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="input-field"
                                        value={leaveForm.startDate}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label-field">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="input-field"
                                        value={leaveForm.endDate}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                                <div className="sm:col-span-2">
                                    <label className="label-field">Reason / Remarks</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Medical emergency, personal matters"
                                        className="input-field"
                                        value={leaveForm.reason}
                                        onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <button type="submit" className="btn-primary w-full py-2.5">
                                        Save Leave Record
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Historical Leave Table */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Saved Leave History</h4>
                            {(!selectedStaffForLeave.leaves || selectedStaffForLeave.leaves.length === 0) ? (
                                <p className="text-xs text-gray-400 text-center py-6">No leave records logged yet for this employee.</p>
                            ) : (
                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-100 text-gray-600 font-semibold uppercase text-[10px]">
                                            <tr>
                                                <th className="py-2.5 px-3">Type</th>
                                                <th className="py-2.5 px-3">Period</th>
                                                <th className="py-2.5 px-3">Duration</th>
                                                <th className="py-2.5 px-3">Reason</th>
                                                <th className="py-2.5 px-3">Status</th>
                                                <th className="py-2.5 px-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {selectedStaffForLeave.leaves.map((l, idx) => (
                                                <tr key={l.id || idx} className="hover:bg-gray-50/50">
                                                    <td className="py-2.5 px-3 font-bold text-gray-800">{l.leaveType}</td>
                                                    <td className="py-2.5 px-3 text-gray-600">
                                                        {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-semibold text-primary-700">{l.days || 1} day(s)</td>
                                                    <td className="py-2.5 px-3 text-gray-500 max-w-[150px] truncate">{l.reason || "—"}</td>
                                                    <td className="py-2.5 px-3">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            {l.status || "Approved"}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteLeave(l.id)}
                                                            className="p-1 text-coral-600 hover:bg-coral-50 rounded transition inline-flex items-center"
                                                            title="Delete Leave"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setLeaveModalOpen(false)}
                                className="btn-secondary text-xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Staff;
