import React, { useEffect, useState } from "react";
import { Plus, Search, Bed, UserCheck, LogOut, Building, Calendar } from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import toast from "react-hot-toast";

const Admissions = () => {
    const [admissions, setAdmissions] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);

    const [form, setForm] = useState({
        patient: "",
        doctor: "",
        roomNumber: "Ward 3",
        bedNumber: "B-12",
        reason: "Post-operative recovery monitoring",
        dailyRate: 1500,
        notes: "",
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resAdm, resPat, resDoc] = await Promise.all([
                api.get("/admissions"),
                api.get("/patients"),
                api.get("/doctors"),
            ]);
            setAdmissions(resAdm.data);
            setPatients(resPat.data);
            setDoctors(resDoc.data);
            if (resPat.data.length && resDoc.data.length) {
                setForm((prev) => ({
                    ...prev,
                    patient: resPat.data[0]._id,
                    doctor: resDoc.data[0]._id,
                }));
            }
        } catch (error) {
            toast.error("Failed to load admission records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/admissions", form);
            toast.success("Patient admitted successfully");
            setModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to admit patient");
        }
    };

    const handleDischarge = async (adm) => {
        if (!confirm(`Confirm discharge for ${adm.patient?.firstName} ${adm.patient?.lastName}?`)) return;
        try {
            await api.put(`/admissions/${adm._id}`, { status: "Discharged" });
            toast.success("Patient discharged");
            fetchData();
        } catch (error) {
            toast.error("Failed to discharge patient");
        }
    };

    const filteredAdmissions = admissions.filter((a) => {
        const patName = a.patient ? `${a.patient.firstName} ${a.patient.lastName}`.toLowerCase() : "";
        const room = a.roomNumber ? a.roomNumber.toLowerCase() : "";
        const s = search.toLowerCase();
        return patName.includes(s) || room.includes(s);
    });

    const activeInpatients = admissions.filter((a) => a.status === "Admitted").length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Inpatient & Admission Management</h1>
                    <p className="text-gray-500">Track patient room allocations, bed occupancy, and discharge workflows.</p>
                </div>
                <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 w-fit">
                    <Plus size={18} /> Admit New Patient
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-primary-50 border border-primary-100 p-4 rounded-2xl flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold">
                        <Bed size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-primary-700 font-semibold uppercase">Currently Admitted</p>
                        <h2 className="text-2xl font-bold text-primary-900">{activeInpatients} Patients</h2>
                    </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <UserCheck size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-emerald-700 font-semibold uppercase">Total Admissions</p>
                        <h2 className="text-2xl font-bold text-emerald-900">{admissions.length} Registered</h2>
                    </div>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                    className="input-field pl-10"
                    placeholder="Search by patient name or room number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredAdmissions.map((a) => (
                        <div key={a._id} className="card hover:shadow-md transition-shadow flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                                            <Building size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 leading-tight">
                                                {a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : "Unknown Patient"}
                                            </h3>
                                            <span className="text-xs text-gray-400">Phone: {a.patient?.phone}</span>
                                        </div>
                                    </div>
                                    <Badge status={a.status} />
                                </div>

                                <div className="bg-gray-50 p-3 rounded-xl space-y-1.5 text-xs text-gray-600 my-3">
                                    <div className="flex justify-between font-semibold text-gray-800">
                                        <span>Room: {a.roomNumber}</span>
                                        <span>Bed: {a.bedNumber}</span>
                                    </div>
                                    <p><span className="text-gray-400">Attending:</span> {a.doctor?.name || "Dr. Staff"}</p>
                                    <p><span className="text-gray-400">Admitted Date:</span> {new Date(a.admissionDate).toLocaleDateString()}</p>
                                    {a.dischargeDate && (
                                        <p><span className="text-gray-400">Discharged Date:</span> {new Date(a.dischargeDate).toLocaleDateString()}</p>
                                    )}
                                    <p><span className="text-gray-400">Reason:</span> {a.reason}</p>
                                    <p><span className="text-gray-400">Daily Charge:</span> LKR {a.dailyRate.toLocaleString()}</p>
                                </div>
                            </div>

                            {a.status === "Admitted" && (
                                <button
                                    onClick={() => handleDischarge(a)}
                                    className="w-full bg-coral-600 hover:bg-coral-700 text-white font-medium rounded-xl text-xs py-2.5 flex items-center justify-center gap-1.5 transition mt-2"
                                >
                                    <LogOut size={14} /> Process Discharge
                                </button>
                            )}
                        </div>
                    ))}
                    {!filteredAdmissions.length && (
                        <p className="text-gray-400 text-center col-span-full py-16">No admission records found.</p>
                    )}
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Inpatient Admission">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label-field">Patient</label>
                        <select
                            className="input-field"
                            value={form.patient}
                            onChange={(e) => setForm({ ...form, patient: e.target.value })}
                            required
                        >
                            {patients.map((p) => (
                                <option key={p._id} value={p._id}>
                                    {p.firstName} {p.lastName} ({p.phone})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label-field">Attending Doctor</label>
                        <select
                            className="input-field"
                            value={form.doctor}
                            onChange={(e) => setForm({ ...form, doctor: e.target.value })}
                            required
                        >
                            {doctors.map((d) => (
                                <option key={d._id} value={d._id}>
                                    {d.name} ({d.specialization})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-field">Room / Ward Number</label>
                            <input
                                required
                                className="input-field"
                                placeholder="e.g. ICU-01 or Ward 3"
                                value={form.roomNumber}
                                onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label-field">Bed Number</label>
                            <input
                                required
                                className="input-field"
                                placeholder="e.g. Bed 04"
                                value={form.bedNumber}
                                onChange={(e) => setForm({ ...form, bedNumber: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-field">Admission Reason</label>
                            <input
                                required
                                className="input-field"
                                placeholder="Diagnosis / Reason"
                                value={form.reason}
                                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label-field">Daily Room Charge (LKR)</label>
                            <input
                                type="number"
                                required
                                className="input-field"
                                value={form.dailyRate}
                                onChange={(e) => setForm({ ...form, dailyRate: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn-primary w-full">
                        Confirm Inpatient Admission
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Admissions;
