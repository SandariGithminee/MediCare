import React, { useEffect, useState } from "react";
import { Plus, Search, FlaskConical, TestTube, CheckCircle2, Clock, FileText, Printer, Paperclip, ExternalLink, Download } from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import FileUpload from "../components/FileUpload";
import toast from "react-hot-toast";

const Laboratory = () => {
    const [labTests, setLabTests] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [modalOpen, setModalOpen] = useState(false);
    const [resultModalOpen, setResultModalOpen] = useState(false);
    const [printModalOpen, setPrintModalOpen] = useState(false);

    const [selectedTest, setSelectedTest] = useState(null);
    const [form, setForm] = useState({
        patient: "",
        doctor: "",
        testName: "",
        testCategory: "Blood",
        cost: 2000,
        documents: [],
    });

    const [resultForm, setResultForm] = useState({
        sampleDetails: "Blood sample collected",
        resultValue: "",
        normalRange: "4.0 - 10.0 x10^9 / L",
        unit: "",
        technicianNotes: "Sample processed according to standard lab SOP.",
        documents: [],
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resLab, resPat, resDoc] = await Promise.all([
                api.get("/laboratory"),
                api.get("/patients"),
                api.get("/doctors"),
            ]);
            const labList = Array.isArray(resLab.data) ? resLab.data : [];
            const patList = Array.isArray(resPat.data) ? resPat.data : [];
            const docList = Array.isArray(resDoc.data) ? resDoc.data : [];
            setLabTests(labList);
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
            setLabTests([]);
            setPatients([]);
            setDoctors([]);
            toast.error("Failed to load laboratory data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateTest = async (e) => {
        e.preventDefault();
        try {
            await api.post("/laboratory", form);
            toast.success("Lab test requested successfully");
            setModalOpen(false);
            setForm((prev) => ({
                ...prev,
                testName: "",
                testCategory: "Blood",
                cost: 2000,
                documents: [],
            }));
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create lab request");
        }
    };

    const handleUpdateStatus = async (testId, status) => {
        try {
            await api.put(`/laboratory/${testId}`, { status });
            toast.success(`Status updated to ${status}`);
            fetchData();
        } catch (error) {
            toast.error("Failed to update test status");
        }
    };

    const openResultModal = (test) => {
        setSelectedTest(test);
        setResultForm({
            sampleDetails: test.sampleDetails || "Blood sample in sodium citrate vial",
            resultValue: test.resultValue || "",
            normalRange: test.normalRange || "4.0 - 10.0",
            unit: test.unit || "mg/dL",
            technicianNotes: test.technicianNotes || "Verified by Senior Medical Technologist.",
            documents: test.documents || [],
        });
        setResultModalOpen(true);
    };

    const handleSaveResult = async (e) => {
        e.preventDefault();
        try {
            const testId = selectedTest?._id || selectedTest?.id;
            await api.put(`/laboratory/${testId}`, {
                ...resultForm,
                status: "Completed",
            });
            toast.success("Lab result recorded and report generated!");
            setResultModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to record result");
        }
    };

    const openPrintReport = (test) => {
        setSelectedTest(test);
        setPrintModalOpen(true);
    };

    const safeLabTests = Array.isArray(labTests) ? labTests : [];
    const filteredTests = safeLabTests.filter((t) => {
        if (!t) return false;
        const patName = t.patient ? `${t.patient.firstName || ""} ${t.patient.lastName || ""}`.toLowerCase() : "";
        const testN = t.testName ? t.testName.toLowerCase() : "";
        const s = (search || "").toLowerCase();
        const matchesSearch = patName.includes(s) || testN.includes(s);
        const matchesStatus = filterStatus === "All" || t.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Main Laboratory Content (Hidden during Print) */}
            <div className="space-y-6 no-print">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Laboratory Management</h1>
                        <p className="text-gray-500">Process test requests, sample tracking, result entry, and lab reports.</p>
                    </div>
                    <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 w-fit">
                        <Plus size={18} /> Request Lab Test
                    </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            className="input-field pl-10"
                            placeholder="Search lab tests or patient name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                        {["All", "Requested", "Sample Collected", "In Progress", "Completed"].map((st) => (
                            <button
                                key={st}
                                onClick={() => setFilterStatus(st)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filterStatus === st ? "bg-white text-primary-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredTests.map((t) => (
                            <div key={t._id} className="card hover:shadow-md transition-shadow flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
                                                <FlaskConical size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 leading-tight">{t.testName}</h3>
                                                <span className="text-xs text-gray-400">{t.testCategory} Panel</span>
                                            </div>
                                        </div>
                                        <Badge status={t.status} />
                                    </div>

                                    <div className="space-y-2 text-xs text-gray-600 my-4 bg-gray-50 p-3 rounded-xl">
                                        <p>
                                            <span className="font-semibold text-gray-700">Patient:</span>{" "}
                                            {t.patient ? `${t.patient.firstName} ${t.patient.lastName}` : "N/A"}
                                        </p>
                                        <p>
                                            <span className="font-semibold text-gray-700">Doctor:</span> {t.doctor?.name || "N/A"}
                                        </p>
                                        <p>
                                            <span className="font-semibold text-gray-700">Requested:</span>{" "}
                                            {new Date(t.requestedDate).toLocaleDateString()}
                                        </p>
                                        {t.resultValue && (
                                            <div className="pt-1 border-t border-gray-200">
                                                <span className="font-semibold text-gray-700">Result:</span>{" "}
                                                <span className="text-primary-700 font-bold">{t.resultValue}</span>
                                            </div>
                                        )}

                                        {t.documents && t.documents.length > 0 && (
                                            <div className="pt-2 border-t border-gray-200">
                                                <span className="font-semibold text-gray-700 flex items-center gap-1 mb-1">
                                                    <Paperclip size={12} className="text-primary-600" /> Files ({t.documents.length}):
                                                </span>
                                                <div className="flex flex-wrap gap-1">
                                                    {t.documents.map((doc, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={doc.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-[11px] text-primary-700 hover:bg-primary-50 truncate max-w-[140px]"
                                                            title={doc.name || doc.originalName}
                                                        >
                                                            <FileText size={11} />
                                                            <span className="truncate">{doc.name || doc.originalName || "Document"}</span>
                                                            <ExternalLink size={10} />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                                    {t.status === "Requested" && (
                                        <button
                                            onClick={() => handleUpdateStatus(t._id, "Sample Collected")}
                                            className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1"
                                        >
                                            <TestTube size={14} /> Collect Sample
                                        </button>
                                    )}
                                    {t.status === "Sample Collected" && (
                                        <button
                                            onClick={() => openResultModal(t)}
                                            className="flex-1 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-xl text-xs py-2 flex items-center justify-center gap-1"
                                        >
                                            <FileText size={14} /> Enter Result
                                        </button>
                                    )}
                                    {t.status === "Completed" && (
                                        <button
                                            onClick={() => openPrintReport(t)}
                                            className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-xl text-xs py-2 flex items-center justify-center gap-1"
                                        >
                                            <Printer size={14} /> View / Print Report
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {!filteredTests.length && <p className="text-gray-400 text-center col-span-full py-16">No lab tests found.</p>}
                    </div>
                )}
            </div>

            {/* Modal: Request Lab Test */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Request Laboratory Test">
                <form onSubmit={handleCreateTest} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
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
                        <label className="label-field">Requesting Doctor</label>
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
                    <div>
                        <label className="label-field">Test Name</label>
                        <input
                            required
                            className="input-field"
                            placeholder="e.g. Complete Blood Count (CBC)"
                            value={form.testName}
                            onChange={(e) => setForm({ ...form, testName: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-field">Category</label>
                            <select
                                className="input-field"
                                value={form.testCategory}
                                onChange={(e) => setForm({ ...form, testCategory: e.target.value })}
                            >
                                <option>Blood</option>
                                <option>Urine</option>
                                <option>Radiology</option>
                                <option>Pathology</option>
                                <option>Biochemistry</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-field">Estimated Cost (LKR)</label>
                            <input
                                type="number"
                                className="input-field"
                                value={form.cost}
                                onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <FileUpload
                            value={form.documents}
                            onChange={(docs) => setForm({ ...form, documents: docs })}
                            folder="lab-requests"
                            label="Attach Test Requisition / Clinical Orders"
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full">
                        Submit Test Request
                    </button>
                </form>
            </Modal>

            {/* Modal: Enter Result */}
            <Modal isOpen={resultModalOpen} onClose={() => setResultModalOpen(false)} title="Enter Laboratory Test Result">
                <form onSubmit={handleSaveResult} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                    <div>
                        <label className="label-field">Sample Details</label>
                        <input
                            className="input-field"
                            value={resultForm.sampleDetails}
                            onChange={(e) => setResultForm({ ...resultForm, sampleDetails: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="label-field">Test Result Value</label>
                        <textarea
                            required
                            rows={3}
                            className="input-field"
                            placeholder="Enter observed laboratory findings..."
                            value={resultForm.resultValue}
                            onChange={(e) => setResultForm({ ...resultForm, resultValue: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-field">Normal Reference Range</label>
                            <input
                                className="input-field"
                                value={resultForm.normalRange}
                                onChange={(e) => setResultForm({ ...resultForm, normalRange: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label-field">Unit of Measurement</label>
                            <input
                                className="input-field"
                                placeholder="e.g. mg/dL"
                                value={resultForm.unit}
                                onChange={(e) => setResultForm({ ...resultForm, unit: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="label-field">Lab Technician Notes</label>
                        <textarea
                            rows={2}
                            className="input-field"
                            value={resultForm.technicianNotes}
                            onChange={(e) => setResultForm({ ...resultForm, technicianNotes: e.target.value })}
                        />
                    </div>

                    <div className="pt-2">
                        <FileUpload
                            value={resultForm.documents}
                            onChange={(docs) => setResultForm({ ...resultForm, documents: docs })}
                            folder="lab-results"
                            label="Attach Scanned Lab Report / Imaging Result (Stored in Supabase 'Uploads')"
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full">
                        Complete & Publish Report
                    </button>
                </form>
            </Modal>

            {/* Modal: Printable Report */}
            <Modal isOpen={printModalOpen} onClose={() => setPrintModalOpen(false)} title="Official Laboratory Report">
                {printModalOpen && selectedTest && (
                    <div className="printable-report space-y-6 p-4 bg-white border border-gray-200 rounded-xl">
                        <div className="flex justify-between border-b pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-primary-700">MEDICARE DIAGNOSTICS</h2>
                                <p className="text-xs text-gray-500">Central Laboratory Division</p>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                                <p>Date: {new Date(selectedTest.completedAt || selectedTest.updatedAt || Date.now()).toLocaleDateString()}</p>
                                <p>Report ID: LAB-{String(selectedTest._id || selectedTest.id || "").padStart(6, "0").toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg text-sm">
                            <div>
                                <p className="text-xs text-gray-400">PATIENT NAME</p>
                                <p className="font-bold text-gray-800">
                                    {selectedTest.patient ? `${selectedTest.patient.firstName} ${selectedTest.patient.lastName}` : "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">REQUESTING DOCTOR</p>
                                <p className="font-bold text-gray-800">{selectedTest.doctor?.name || "Staff Physician"}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-bold text-gray-800 border-b pb-1">Test Specification: {selectedTest.testName}</h3>
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-gray-100 text-xs text-gray-600">
                                        <th className="p-2">Parameter</th>
                                        <th className="p-2">Observed Result</th>
                                        <th className="p-2">Reference Range</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="p-2 font-medium">{selectedTest.testName}</td>
                                        <td className="p-2 font-bold text-primary-700">{selectedTest.resultValue || "Pending"}</td>
                                        <td className="p-2 text-gray-500">{selectedTest.normalRange} {selectedTest.unit}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {selectedTest.technicianNotes && (
                            <div className="text-xs text-gray-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                                <span className="font-bold text-amber-800">Technician Remarks:</span> {selectedTest.technicianNotes}
                            </div>
                        )}

                        {selectedTest.documents && selectedTest.documents.length > 0 && (
                            <div className="space-y-2 border-t pt-3">
                                <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                    <Paperclip size={14} className="text-primary-600" /> Attached Diagnostic Files ({selectedTest.documents.length})
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {selectedTest.documents.map((doc, idx) => (
                                        <a
                                            key={idx}
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-2 bg-gray-50 border rounded-lg text-xs hover:border-primary-400 text-gray-700 hover:text-primary-700"
                                        >
                                            <span className="truncate font-medium">{doc.name || doc.originalName || "Attached Report"}</span>
                                            <ExternalLink size={13} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100 no-print">
                            <button onClick={() => window.print()} className="btn-primary text-xs flex items-center gap-1.5">
                                <Printer size={14} /> Print Formal Report
                            </button>
                            <button onClick={() => setPrintModalOpen(false)} className="text-xs font-semibold text-gray-500 hover:text-gray-700">
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Laboratory;
