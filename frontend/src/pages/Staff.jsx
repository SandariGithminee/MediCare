import React, { useEffect, useState } from "react";
import { Plus, Search, UserCheck, Calendar, DollarSign, Briefcase, Mail, Phone } from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import toast from "react-hot-toast";

const Staff = () => {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);

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
            setStaffList(data);
        } catch (error) {
            toast.error("Failed to load staff list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const rawDigits = (form.phone || "").replace(/\D/g, "");
        if (!form.phone || !form.phone.trim()) {
            return toast.error("Phone number is required.");
        }
        if (rawDigits.length !== 10) {
            return toast.error("Phone number must be exactly 10 digits.");
        }
        try {
            await api.post("/staff", form);
            toast.success("Employee registered");
            setModalOpen(false);
            fetchStaff(search);
        } catch (error) {
            toast.error(error.friendlyMessage || error.response?.data?.message || "Failed to add employee");
        }
    };

    const handleAttendance = async (staffId, status) => {
        try {
            await api.post(`/staff/${staffId}/attendance`, { status });
            toast.success(`Marked attendance: ${status}`);
            fetchStaff(search);
        } catch (error) {
            toast.error("Attendance update failed");
        }
    };

    const filteredStaff = staffList.filter((s) => {
        const name = s.name ? s.name.toLowerCase() : "";
        const dept = s.department ? s.department.toLowerCase() : "";
        const role = s.role ? s.role.toLowerCase() : "";
        const q = search.toLowerCase();
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
                                    <Badge status={s.status} />
                                </div>

                                <div className="space-y-1.5 text-xs text-gray-500 my-4 bg-gray-50 p-3 rounded-xl">
                                    <p className="flex items-center gap-2"><Briefcase size={14} /> ID: <span className="font-mono font-bold text-gray-700">{s.employeeId}</span></p>
                                    <p className="flex items-center gap-2"><Phone size={14} /> {s.phone}</p>
                                    <p className="flex items-center gap-2"><Mail size={14} /> {s.email}</p>
                                    <p className="flex items-center gap-2"><DollarSign size={14} /> Salary: LKR {s.salary?.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-100 flex gap-2">
                                <button
                                    onClick={() => handleAttendance(s._id, "Present")}
                                    className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold py-2 rounded-xl transition"
                                >
                                    Mark Present
                                </button>
                                <button
                                    onClick={() => handleAttendance(s._id, "Absent")}
                                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold py-2 rounded-xl transition"
                                >
                                    Mark Absent
                                </button>
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
        </div>
    );
};

export default Staff;
