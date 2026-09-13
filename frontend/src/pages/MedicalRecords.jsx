import React, { useEffect, useState } from "react";
import { Plus, Search, FileText, Activity, Stethoscope, User, Calendar, Pill, Paperclip, ExternalLink, Download } from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";
import FileUpload from "../components/FileUpload";
import toast from "react-hot-toast";

const MedicalRecords = () => {
    const [records, setRecords] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({
        patient: "",
        doctor: "",
        diagnosis: "",
        symptoms: "",
        treatmentPlan: "",
        bloodPressure: "120/80",
        heartRate: "72 bpm",
        temperature: "98.6 °F",
        weight: "70 kg",
        prescriptions: [{ medicineName: "", dosage: "", frequency: "Once daily", duration: "7 days" }],
        notes: "",
        documents: [],
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resRec, resPat, resDoc] = await Promise.all([
                api.get("/medical-records"),
                api.get("/patients"),
                api.get("/doctors"),
            ]);
            const recList = Array.isArray(resRec.data) ? resRec.data : [];
            const patList = Array.isArray(resPat.data) ? resPat.data : [];
            const docList = Array.isArray(resDoc.data) ? resDoc.data : [];
            setRecords(recList);
            setPatients(patList);
            setDoctors(docList);
            if (patList.length && docList.length) {
                setForm((prev) => ({
                    ...prev,
                    patient: patList[0]._id,
                    doctor: docList[0]._id,
                }));
            }
        } catch (error) {
            setRecords([]);
            setPatients([]);
            setDoctors([]);
            toast.error("Failed to load medical records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddPrescriptionField = () => {
        setForm({
            ...form,
            prescriptions: [
                ...form.prescriptions,
                { medicineName: "", dosage: "", frequency: "Once daily", duration: "7 days" },
            ],
        });
    };

    const handlePrescriptionChange = (index, field, value) => {
        const updated = [...form.prescriptions];
        updated[index][field] = value;
        setForm({ ...form, prescriptions: updated });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                patient: form.patient,
                doctor: form.doctor,
                diagnosis: form.diagnosis,
                symptoms: form.symptoms,
                treatmentPlan: form.treatmentPlan,
                vitalSigns: {
                    bloodPressure: form.bloodPressure,
                    heartRate: form.heartRate,
                    temperature: form.temperature,
                    weight: form.weight,
                },
                prescriptions: form.prescriptions
                    .filter((p) => p.medicineName.trim())
                    .map((p) => ({ ...p, status: p.status || "Pending" })),
                notes: form.notes,
                documents: form.documents || [],
            };
            await api.post("/medical-records", payload);
            toast.success("Medical record created successfully");
            setModalOpen(false);
            setForm((prev) => ({
                ...prev,
                diagnosis: "",
                symptoms: "",
                treatmentPlan: "",
                notes: "",
                documents: [],
                prescriptions: [{ medicineName: "", dosage: "", frequency: "Once daily", duration: "7 days" }],
            }));
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save medical record");
        }
    };

    const safeRecords = Array.isArray(records) ? records : [];
    const filteredRecords = safeRecords.filter((r) => {
        if (!r) return false;
        const patName = r.patient ? `${r.patient.firstName || ""} ${r.patient.lastName || ""}`.toLowerCase() : "";
        const diag = r.diagnosis ? r.diagnosis.toLowerCase() : "";
        const docName = r.doctor ? (r.doctor.name || "").toLowerCase() : "";
        const s = (search || "").toLowerCase();
        return patName.includes(s) || diag.includes(s) || docName.includes(s);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Electronic Medical Records (EMR)</h1>
                    <p className="text-gray-500">Track patient diagnoses, vitals, treatment plans, and prescriptions.</p>
                </div>
                <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 w-fit">
                    <Plus size={18} /> New Medical Record
                </button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                    className="input-field pl-10"
                    placeholder="Search EMR by patient, diagnosis, or doctor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredRecords.map((r) => (
                        <div key={r._id} className="card hover:shadow-md transition-shadow">
                            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base">
                                            {r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : "Unknown Patient"}
                                        </h3>
                                        <p className="text-xs text-gray-400">
                                            {r.patient?.gender} · Blood: {r.patient?.bloodGroup || "N/A"} · Phone: {r.patient?.phone}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-xs font-semibold">
                                        <Stethoscope size={14} /> {r.doctor?.name || "Doctor"}
                                    </span>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center justify-end gap-1">
                                        <Calendar size={12} /> {new Date(r.recordDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4 pt-3">
                                <div className="md:col-span-2 space-y-2">
                                    <div>
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Diagnosis</span>
                                        <p className="text-gray-800 font-semibold text-base">{r.diagnosis}</p>
                                    </div>
                                    {r.symptoms && (
                                        <div>
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Symptoms</span>
                                            <p className="text-sm text-gray-600">{r.symptoms}</p>
                                        </div>
                                    )}
                                    {r.treatmentPlan && (
                                        <div>
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Treatment Plan</span>
                                            <p className="text-sm text-gray-600">{r.treatmentPlan}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 p-3 rounded-xl space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary-700 uppercase">
                                        <Activity size={14} /> Vital Signs
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-gray-400">BP:</span> <span className="font-semibold text-gray-700">{r.vitalSigns?.bloodPressure || "120/80"}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Heart Rate:</span> <span className="font-semibold text-gray-700">{r.vitalSigns?.heartRate || "72 bpm"}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Temp:</span> <span className="font-semibold text-gray-700">{r.vitalSigns?.temperature || "98.6 °F"}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Weight:</span> <span className="font-semibold text-gray-700">{r.vitalSigns?.weight || "70 kg"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {r.prescriptions && r.prescriptions.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                        <Pill size={14} className="text-primary-600" /> Prescribed Medications
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {r.prescriptions.map((p, idx) => {
                                            const isDispensed = p.status === "Dispensed";
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`px-3 py-1.5 rounded-lg text-xs border flex items-center gap-2 ${
                                                        isDispensed
                                                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                            : "bg-primary-50 text-primary-800 border-primary-200"
                                                    }`}
                                                >
                                                    <span className="font-bold">{p.medicineName}</span>
                                                    <span className="opacity-75">({p.dosage} · {p.frequency} · {p.duration})</span>
                                                    <span
                                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                            isDispensed
                                                                ? "bg-emerald-200/60 text-emerald-900"
                                                                : "bg-amber-100 text-amber-800"
                                                        }`}
                                                    >
                                                        {isDispensed ? "✓ Dispensed" : "⏳ Pending Pharmacy"}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {r.documents && r.documents.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                        <Paperclip size={14} className="text-primary-600" /> Attached Documents ({r.documents.length})
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {r.documents.map((doc, idx) => (
                                            <a
                                                key={idx}
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 rounded-lg text-xs text-gray-700 hover:text-primary-700 transition-colors group"
                                            >
                                                <FileText size={13} className="text-primary-500" />
                                                <span className="max-w-[180px] truncate font-medium">{doc.name || doc.originalName || "Document"}</span>
                                                <ExternalLink size={12} className="text-gray-400 group-hover:text-primary-600" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {!filteredRecords.length && (
                        <p className="text-gray-400 text-center py-16">No medical records found.</p>
                    )}
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New EMR Record">
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>

                    <div>
                        <label className="label-field">Diagnosis</label>
                        <input
                            required
                            className="input-field"
                            placeholder="e.g. Mild Hypertension"
                            value={form.diagnosis}
                            onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="label-field">Symptoms</label>
                        <textarea
                            rows={2}
                            className="input-field"
                            placeholder="e.g. Dizziness, headaches, fatigue"
                            value={form.symptoms}
                            onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="label-field">Treatment Plan</label>
                        <textarea
                            rows={2}
                            className="input-field"
                            placeholder="e.g. Low sodium diet, light cardiovascular exercise"
                            value={form.treatmentPlan}
                            onChange={(e) => setForm({ ...form, treatmentPlan: e.target.value })}
                        />
                    </div>

                    <div className="bg-gray-50 p-3 rounded-xl space-y-3">
                        <span className="text-xs font-bold text-gray-600 uppercase">Vital Signs</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                                <label className="text-xs text-gray-500">BP</label>
                                <input
                                    className="input-field text-xs"
                                    value={form.bloodPressure}
                                    onChange={(e) => setForm({ ...form, bloodPressure: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Heart Rate</label>
                                <input
                                    className="input-field text-xs"
                                    value={form.heartRate}
                                    onChange={(e) => setForm({ ...form, heartRate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Temperature</label>
                                <input
                                    className="input-field text-xs"
                                    value={form.temperature}
                                    onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Weight</label>
                                <input
                                    className="input-field text-xs"
                                    value={form.weight}
                                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="label-field">Prescriptions</label>
                            <button
                                type="button"
                                onClick={handleAddPrescriptionField}
                                className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                            >
                                + Add Medicine
                            </button>
                        </div>
                        {form.prescriptions.map((p, idx) => (
                            <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
                                <input
                                    className="input-field text-xs"
                                    placeholder="Medicine Name"
                                    value={p.medicineName}
                                    onChange={(e) => handlePrescriptionChange(idx, "medicineName", e.target.value)}
                                />
                                <input
                                    className="input-field text-xs"
                                    placeholder="Dosage (500mg)"
                                    value={p.dosage}
                                    onChange={(e) => handlePrescriptionChange(idx, "dosage", e.target.value)}
                                />
                                <input
                                    className="input-field text-xs"
                                    placeholder="Frequency"
                                    value={p.frequency}
                                    onChange={(e) => handlePrescriptionChange(idx, "frequency", e.target.value)}
                                />
                                <input
                                    className="input-field text-xs"
                                    placeholder="Duration"
                                    value={p.duration}
                                    onChange={(e) => handlePrescriptionChange(idx, "duration", e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className="label-field">Doctor Notes</label>
                        <textarea
                            rows={2}
                            className="input-field"
                            placeholder="Additional clinical notes..."
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        />
                    </div>

                    {/* Supabase Storage Upload */}
                    <div className="pt-2">
                        <FileUpload
                            value={form.documents}
                            onChange={(docs) => setForm({ ...form, documents: docs })}
                            folder="emr-records"
                            label="Medical Attachments (Lab Scans, X-Rays, Discharge Summaries)"
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full">
                        Save Medical Record
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default MedicalRecords;
