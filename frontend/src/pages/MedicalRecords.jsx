import React, { useEffect, useState } from "react";
import { Plus, Search, FileText, Activity, Stethoscope, User, Calendar, Pill, Paperclip, ExternalLink, Download, Pencil, Trash2 } from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";
import FileUpload from "../components/FileUpload";
import toast from "react-hot-toast";

const MedicalRecords = () => {
    const [records, setRecords] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRecordId, setEditingRecordId] = useState(null);

    const emptyForm = {
        patient: "",
        doctor: "",
        recordDate: new Date().toISOString().split("T")[0],
        diagnosis: "",
        symptoms: "",
        treatmentPlan: "",
        bloodPressure: "120/80",
        heartRate: "72 bpm",
        temperature: "98.6 °F",
        weight: "70 kg",
        prescriptions: [{ medicineName: "", dosage: "", frequency: "Once daily", duration: "7 days", status: "Pending" }],
        notes: "",
        documents: [],
    };

    const [form, setForm] = useState(emptyForm);

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
                    patient: prev.patient || patList[0]._id || patList[0].id,
                    doctor: prev.doctor || docList[0]._id || docList[0].id,
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

    const openCreateModal = () => {
        setEditingRecordId(null);
        setForm({
            ...emptyForm,
            patient: patients[0]?._id || patients[0]?.id || "",
            doctor: doctors[0]?._id || doctors[0]?.id || "",
            recordDate: new Date().toISOString().split("T")[0],
        });
        setModalOpen(true);
    };

    const openEditModal = (record) => {
        setEditingRecordId(record._id || record.id);
        const vitals = record.vitalSigns || record.vitals || {};
        const prescriptionsList = (record.prescriptions && record.prescriptions.length > 0)
            ? record.prescriptions.map((p) => ({
                medicineName: p.medicineName || "",
                dosage: p.dosage || "",
                frequency: p.frequency || "Once daily",
                duration: p.duration || "7 days",
                status: p.status || "Pending",
              }))
            : [{ medicineName: "", dosage: "", frequency: "Once daily", duration: "7 days", status: "Pending" }];

        const recDate = record.recordDate || record.date
            ? new Date(record.recordDate || record.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0];

        setForm({
            patient: record.patient?._id || record.patient?.id || record.patient_id || (patients[0]?._id || patients[0]?.id || ""),
            doctor: record.doctor?._id || record.doctor?.id || record.doctor_id || (doctors[0]?._id || doctors[0]?.id || ""),
            recordDate: recDate,
            diagnosis: record.diagnosis || "",
            symptoms: record.symptoms || "",
            treatmentPlan: record.treatmentPlan || "",
            bloodPressure: vitals.bloodPressure || "120/80",
            heartRate: vitals.heartRate || "72 bpm",
            temperature: vitals.temperature || "98.6 °F",
            weight: vitals.weight || "70 kg",
            prescriptions: prescriptionsList,
            notes: record.notes || "",
            documents: Array.isArray(record.documents) ? record.documents : [],
        });
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingRecordId(null);
    };

    const handleAddPrescriptionField = () => {
        setForm((prev) => ({
            ...prev,
            prescriptions: [
                ...prev.prescriptions,
                { medicineName: "", dosage: "", frequency: "Once daily", duration: "7 days", status: "Pending" },
            ],
        }));
    };

    const handleRemovePrescriptionField = (index) => {
        setForm((prev) => {
            if (prev.prescriptions.length <= 1) {
                return {
                    ...prev,
                    prescriptions: [{ medicineName: "", dosage: "", frequency: "Once daily", duration: "7 days", status: "Pending" }],
                };
            }
            return {
                ...prev,
                prescriptions: prev.prescriptions.filter((_, i) => i !== index),
            };
        });
    };

    const handlePrescriptionChange = (index, field, value) => {
        setForm((prev) => {
            const updated = [...prev.prescriptions];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, prescriptions: updated };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const vitalsObj = {
                bloodPressure: form.bloodPressure,
                heartRate: form.heartRate,
                temperature: form.temperature,
                weight: form.weight,
            };
            const payload = {
                patient: form.patient,
                doctor: form.doctor,
                recordDate: form.recordDate,
                diagnosis: form.diagnosis,
                symptoms: form.symptoms,
                treatmentPlan: form.treatmentPlan,
                vitalSigns: vitalsObj,
                vitals: vitalsObj,
                prescriptions: form.prescriptions
                    .filter((p) => p.medicineName && p.medicineName.trim())
                    .map((p) => ({ ...p, status: p.status || "Pending" })),
                notes: form.notes,
                documents: form.documents || [],
            };

            if (editingRecordId) {
                await api.put(`/medical-records/${editingRecordId}`, payload);
                toast.success("Medical record updated successfully");
            } else {
                await api.post("/medical-records", payload);
                toast.success("Medical record created successfully");
            }

            setModalOpen(false);
            setEditingRecordId(null);
            setForm({
                ...emptyForm,
                patient: patients[0]?._id || patients[0]?.id || "",
                doctor: doctors[0]?._id || doctors[0]?.id || "",
            });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${editingRecordId ? "update" : "save"} medical record`);
        } finally {
            setSubmitting(false);
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
                <button onClick={openCreateModal} className="btn-primary flex items-center gap-2 w-fit">
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
                        <div key={r._id || r.id} className="card hover:shadow-md transition-shadow">
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
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-xs font-semibold">
                                            <Stethoscope size={14} /> {r.doctor?.name || "Doctor"}
                                        </span>
                                        <p className="text-xs text-gray-400 mt-1 flex items-center justify-end gap-1">
                                            <Calendar size={12} /> {new Date(r.recordDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => openEditModal(r)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-accent-700 bg-accent-50 hover:bg-accent-100 border border-accent-200/80 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
                                        title="Edit Medical Record"
                                    >
                                        <Pencil size={13} />
                                        <span>Edit</span>
                                    </button>
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
                                            <span className="text-gray-400">BP:</span> <span className="font-semibold text-gray-700">{r.vitalSigns?.bloodPressure || r.vitals?.bloodPressure || "120/80"}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Heart Rate:</span> <span className="font-semibold text-gray-700">{r.vitalSigns?.heartRate || r.vitals?.heartRate || "72 bpm"}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Temp:</span> <span className="font-semibold text-gray-700">{r.vitalSigns?.temperature || r.vitals?.temperature || "98.6 °F"}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Weight:</span> <span className="font-semibold text-gray-700">{r.vitalSigns?.weight || r.vitals?.weight || "70 kg"}</span>
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

            <Modal isOpen={modalOpen} onClose={handleCloseModal} title={editingRecordId ? "Edit Medical Record" : "Create New EMR Record"}>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="label-field">Patient</label>
                            <select
                                className="input-field"
                                value={form.patient}
                                onChange={(e) => setForm({ ...form, patient: e.target.value })}
                                required
                            >
                                {patients.map((p) => (
                                    <option key={p._id || p.id} value={p._id || p.id}>
                                        {p.firstName} {p.lastName} ({p.phone || "N/A"})
                                    </option>
                                ))}
                                {form.patient && !patients.some((p) => String(p._id || p.id) === String(form.patient)) && (
                                    <option value={form.patient}>Selected Patient ({form.patient})</option>
                                )}
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
                                    <option key={d._id || d.id} value={d._id || d.id}>
                                        {d.name} ({d.specialization || "General"})
                                    </option>
                                ))}
                                {form.doctor && !doctors.some((d) => String(d._id || d.id) === String(form.doctor)) && (
                                    <option value={form.doctor}>Selected Doctor ({form.doctor})</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="label-field">Record Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={form.recordDate}
                                onChange={(e) => setForm({ ...form, recordDate: e.target.value })}
                                required
                            />
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
                                className="text-xs font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1 cursor-pointer"
                            >
                                <Plus size={14} /> Add Medicine
                            </button>
                        </div>
                        <div className="space-y-2">
                            {form.prescriptions.map((p, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input
                                        className="input-field text-xs flex-[2]"
                                        placeholder="Medicine Name (e.g. Amoxicillin)"
                                        value={p.medicineName}
                                        onChange={(e) => handlePrescriptionChange(idx, "medicineName", e.target.value)}
                                    />
                                    <input
                                        className="input-field text-xs flex-1"
                                        placeholder="Dosage (500mg)"
                                        value={p.dosage}
                                        onChange={(e) => handlePrescriptionChange(idx, "dosage", e.target.value)}
                                    />
                                    <input
                                        className="input-field text-xs flex-1"
                                        placeholder="Frequency"
                                        value={p.frequency}
                                        onChange={(e) => handlePrescriptionChange(idx, "frequency", e.target.value)}
                                    />
                                    <input
                                        className="input-field text-xs flex-1"
                                        placeholder="Duration"
                                        value={p.duration}
                                        onChange={(e) => handlePrescriptionChange(idx, "duration", e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePrescriptionField(idx)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer shrink-0"
                                        title="Remove medicine"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
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

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="btn-secondary flex-1 cursor-pointer"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary flex-1 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {submitting ? (
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : editingRecordId ? (
                                <>
                                    <Pencil size={16} /> Update Medical Record
                                </>
                            ) : (
                                <>
                                    <Plus size={16} /> Save Medical Record
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default MedicalRecords;
