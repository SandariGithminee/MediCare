import React, { useEffect, useState } from "react";
import {
    Plus,
    Search,
    Pill,
    AlertTriangle,
    Clock,
    ShoppingCart,
    PackageCheck,
    Trash2,
    Edit3,
    FileText,
    CheckCircle2,
    AlertCircle,
    Printer,
    Check,
    User,
    Stethoscope,
    Calendar,
    DollarSign,
} from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";
import toast from "react-hot-toast";

const Pharmacy = () => {
    const [activeTab, setActiveTab] = useState("inventory"); // "inventory" | "prescriptions"

    // Inventory State
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
    const [selectedMed, setSelectedMed] = useState(null);
    const [editingMed, setEditingMed] = useState(null);
    const [dispenseQty, setDispenseQty] = useState(1);

    // Prescriptions Processing State
    const [prescriptions, setPrescriptions] = useState([]);
    const [loadingRx, setLoadingRx] = useState(false);
    const [rxSearch, setRxSearch] = useState("");
    const [rxFilter, setRxFilter] = useState("all"); // "all" | "pending" | "dispensed"

    // Prescription Dispense Modal State
    const [dispenseRxModalOpen, setDispenseRxModalOpen] = useState(false);
    const [selectedRxOrder, setSelectedRxOrder] = useState(null);
    const [selectedRxItem, setSelectedRxItem] = useState(null);
    const [dispensingLoading, setDispensingLoading] = useState(false);
    const [dispenseRxForm, setDispenseRxForm] = useState({
        medicineId: "",
        quantity: 10,
        createBill: true,
    });

    // Prescription Printable Slip State
    const [slipModalOpen, setSlipModalOpen] = useState(false);
    const [selectedSlipOrder, setSelectedSlipOrder] = useState(null);

    const [form, setForm] = useState({
        name: "",
        category: "Tablet",
        manufacturer: "",
        batchNumber: "",
        quantityInStock: 100,
        minStockLevel: 20,
        unitPrice: 25,
        expiryDate: "",
        location: "Main Pharmacy",
    });

    const [editForm, setEditForm] = useState({
        name: "",
        category: "Tablet",
        manufacturer: "",
        batchNumber: "",
        quantityInStock: 0,
        minStockLevel: 10,
        unitPrice: 0,
        expiryDate: "",
        location: "Main Pharmacy",
    });

    const fetchMedicines = async (q = "") => {
        setLoading(true);
        try {
            const { data } = await api.get(`/pharmacy${q ? `?search=${q}` : ""}`);
            setMedicines(Array.isArray(data) ? data : (Array.isArray(data?.medicines) ? data.medicines : []));
        } catch (error) {
            setMedicines([]);
            toast.error("Failed to load pharmacy inventory");
        } finally {
            setLoading(false);
        }
    };

    const fetchPrescriptions = async () => {
        setLoadingRx(true);
        try {
            const { data } = await api.get("/pharmacy/prescriptions");
            setPrescriptions(Array.isArray(data) ? data : (Array.isArray(data?.prescriptions) ? data.prescriptions : []));
        } catch (error) {
            setPrescriptions([]);
            toast.error("Failed to load prescription orders");
        } finally {
            setLoadingRx(false);
        }
    };

    useEffect(() => {
        fetchMedicines();
        fetchPrescriptions();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchMedicines(search), 350);
        return () => clearTimeout(timer);
    }, [search]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/pharmacy", form);
            toast.success("Medicine added to inventory");
            setModalOpen(false);
            fetchMedicines(search);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add medicine");
        }
    };

    const openDispenseModal = (med) => {
        setSelectedMed(med);
        setDispenseQty(1);
        setDispenseModalOpen(true);
    };

    const handleDispense = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/pharmacy/${selectedMed._id || selectedMed.id}/dispense`, { quantity: Number(dispenseQty) });
            toast.success(`Dispensed ${dispenseQty} units of ${selectedMed.name}`);
            setDispenseModalOpen(false);
            fetchMedicines(search);
            fetchPrescriptions();
        } catch (error) {
            toast.error(error.response?.data?.message || "Dispense failed");
        }
    };

    const openEditModal = (med) => {
        setEditingMed(med);
        let formattedDate = "";
        if (med.expiryDate) {
            try {
                formattedDate = new Date(med.expiryDate).toISOString().split("T")[0];
            } catch {}
        }
        setEditForm({
            name: med.name || "",
            category: med.category || "Tablet",
            manufacturer: med.manufacturer || "",
            batchNumber: med.batchNumber || "",
            quantityInStock: med.quantityInStock ?? 0,
            minStockLevel: med.minStockLevel ?? 10,
            unitPrice: med.unitPrice ?? 0,
            expiryDate: formattedDate,
            location: med.location || "Main Pharmacy",
        });
        setEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingMed) return;
        try {
            const medId = editingMed._id || editingMed.id;
            await api.put(`/pharmacy/${medId}`, editForm);
            toast.success("Medicine updated successfully");
            setEditModalOpen(false);
            fetchMedicines(search);
            fetchPrescriptions();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update medicine");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Remove this medicine item from pharmacy database?")) return;
        try {
            await api.delete(`/pharmacy/${id}`);
            toast.success("Medicine removed");
            fetchMedicines(search);
            fetchPrescriptions();
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    // Open prescription dispense modal
    const openProcessRxModal = (order, rxItem) => {
        setSelectedRxOrder(order);
        setSelectedRxItem(rxItem);

        // Find matched medicine in inventory or first available
        const defaultMedId = rxItem.matchedMedicine?.id || (medicines.length > 0 ? medicines[0]._id || medicines[0].id : "");

        setDispenseRxForm({
            medicineId: defaultMedId,
            quantity: 10,
            createBill: true,
        });
        setDispenseRxModalOpen(true);
    };

    // Submit prescription dispensation
    const handleDispenseRxSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRxOrder || !selectedRxItem) return;

        setDispensingLoading(true);
        try {
            const recordId = selectedRxOrder.id || selectedRxOrder.recordId;
            const res = await api.post(`/pharmacy/prescriptions/${recordId}/dispense`, {
                prescriptionIndex: selectedRxItem.index,
                medicineId: Number(dispenseRxForm.medicineId),
                quantity: Number(dispenseRxForm.quantity),
                createBill: Boolean(dispenseRxForm.createBill),
            });

            toast.success(res.data.message || "Prescription dispensed successfully!");
            setDispenseRxModalOpen(false);
            fetchPrescriptions();
            fetchMedicines(search);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to dispense prescription");
        } finally {
            setDispensingLoading(false);
        }
    };

    const openSlipModal = (order) => {
        setSelectedSlipOrder(order);
        setSlipModalOpen(true);
    };

    const safeMedicines = Array.isArray(medicines) ? medicines : [];
    const safePrescriptions = Array.isArray(prescriptions) ? prescriptions : [];

    const lowStockCount = safeMedicines.filter((m) => m && m.quantityInStock <= m.minStockLevel).length;

    // Total pending prescription items across all orders
    const pendingRxItemsCount = safePrescriptions.reduce((acc, o) => acc + (o?.pendingCount || 0), 0);

    // Filter prescriptions
    const filteredPrescriptions = safePrescriptions.filter((order) => {
        if (!order) return false;
        const matchesFilter =
            rxFilter === "all" ||
            (rxFilter === "pending" && (order.pendingCount || 0) > 0) ||
            (rxFilter === "dispensed" && (order.pendingCount || 0) === 0);

        const patName = `${order.patient?.firstName || ""} ${order.patient?.lastName || ""}`.toLowerCase();
        const docName = (order.doctor?.name || "").toLowerCase();
        const rxNames = (order.prescriptions || []).map((p) => (p?.medicineName || "").toLowerCase()).join(" ");
        const s = (rxSearch || "").toLowerCase();

        const matchesSearch = !s || patName.includes(s) || docName.includes(s) || rxNames.includes(s);

        return matchesFilter && matchesSearch;
    });

    // Currently selected medicine for calculation inside dispenseRx modal
    const currentChosenMed = safeMedicines.find(
        (m) => m && String(m._id || m.id) === String(dispenseRxForm.medicineId)
    );
    const calculatedRxTotal = currentChosenMed
        ? Number(currentChosenMed.unitPrice || 0) * Number(dispenseRxForm.quantity || 0)
        : 0;

    return (
        <div className="space-y-6">
            {/* Page Title & Main Actions (hidden when printing) */}
            <div className="no-print space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Pharmacy Management</h1>
                        <p className="text-gray-500">
                            Track medicine inventory, process doctor prescriptions, verify stock, and manage dispensing.
                        </p>
                    </div>
                    {activeTab === "inventory" && (
                        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 w-fit">
                            <Plus size={18} /> Add Medicine Item
                        </button>
                    )}
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 gap-6">
                    <button
                        onClick={() => setActiveTab("inventory")}
                        className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
                            activeTab === "inventory"
                                ? "border-primary-600 text-primary-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <PackageCheck size={18} /> Medicine Inventory ({medicines.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("prescriptions")}
                        className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
                            activeTab === "prescriptions"
                                ? "border-primary-600 text-primary-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <FileText size={18} /> Prescription Orders
                        {pendingRxItemsCount > 0 && (
                            <span className="ml-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                {pendingRxItemsCount} Pending
                            </span>
                        )}
                    </button>
                </div>

                {/* TAB 1: MEDICINE INVENTORY */}
                {activeTab === "inventory" && (
                    <div className="space-y-6">
                        {lowStockCount > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800 text-sm">
                                <AlertTriangle className="text-amber-600 shrink-0" size={22} />
                                <div>
                                    <span className="font-bold">{lowStockCount} Medicine(s) Low on Stock!</span>
                                    <p className="text-xs text-amber-700">
                                        Please review inventory levels below and place stock replenishment orders.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                className="input-field pl-10"
                                placeholder="Search by medicine name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-16">
                                <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Medicine & Form</th>
                                                <th className="px-6 py-4">Batch #</th>
                                                <th className="px-6 py-4">Stock Qty</th>
                                                <th className="px-6 py-4">Unit Price</th>
                                                <th className="px-6 py-4">Expiry Date</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {medicines.map((m) => {
                                                const isLow = m.quantityInStock <= m.minStockLevel;
                                                return (
                                                    <tr key={m._id || m.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                                                                    <Pill size={18} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-800">{m.name}</p>
                                                                    <p className="text-xs text-gray-400">
                                                                        {m.category} · {m.manufacturer || "Generic"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 font-mono text-xs text-gray-600">{m.batchNumber}</td>
                                                        <td className="px-6 py-4">
                                                            <span
                                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                                    isLow
                                                                        ? "bg-red-50 text-red-700 border border-red-200"
                                                                        : "bg-emerald-50 text-emerald-700"
                                                                }`}
                                                            >
                                                                {m.quantityInStock} units {isLow && "(Low)"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 font-semibold text-gray-800">
                                                            LKR {Number(m.unitPrice).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs text-gray-500">
                                                            {new Date(m.expiryDate).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-right space-x-1.5">
                                                            <button
                                                                onClick={() => openDispenseModal(m)}
                                                                className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-semibold rounded-lg transition"
                                                            >
                                                                Dispense
                                                            </button>
                                                            <button
                                                                onClick={() => openEditModal(m)}
                                                                className="p-1.5 text-accent-600 hover:bg-accent-50 rounded-lg transition inline-flex items-center justify-center"
                                                                title="Edit Medicine"
                                                            >
                                                                <Edit3 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(m._id || m.id)}
                                                                className="p-1.5 text-coral-600 hover:bg-coral-50 rounded-lg transition inline-flex items-center justify-center"
                                                                title="Delete Medicine"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {!medicines.length && (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-12 text-gray-400">
                                                        No medicines in inventory.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: PRESCRIPTION PROCESSING */}
                {activeTab === "prescriptions" && (
                    <div className="space-y-6">
                        {/* Summary Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold">Total Orders</p>
                                    <p className="text-2xl font-bold text-gray-800">{prescriptions.length}</p>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold">Pending Dispensation</p>
                                    <p className="text-2xl font-bold text-amber-600">{pendingRxItemsCount}</p>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold">Orders Completed</p>
                                    <p className="text-2xl font-bold text-emerald-600">
                                        {prescriptions.filter((o) => o.pendingCount === 0).length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Search & Filter Controls */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="relative w-full sm:max-w-md">
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    className="input-field pl-10"
                                    placeholder="Search by patient, doctor, or drug name..."
                                    value={rxSearch}
                                    onChange={(e) => setRxSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-xl w-full sm:w-auto justify-center">
                                <button
                                    onClick={() => setRxFilter("all")}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                        rxFilter === "all" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-800"
                                    }`}
                                >
                                    All Orders ({prescriptions.length})
                                </button>
                                <button
                                    onClick={() => setRxFilter("pending")}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                        rxFilter === "pending" ? "bg-white text-amber-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                                    }`}
                                >
                                    Pending ({prescriptions.filter((o) => o.pendingCount > 0).length})
                                </button>
                                <button
                                    onClick={() => setRxFilter("dispensed")}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                        rxFilter === "dispensed" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                                    }`}
                                >
                                    Completed ({prescriptions.filter((o) => o.pendingCount === 0).length})
                                </button>
                            </div>
                        </div>

                        {/* Prescription Orders List */}
                        {loadingRx ? (
                            <div className="flex justify-center py-16">
                                <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                            </div>
                        ) : filteredPrescriptions.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
                                <FileText size={48} className="mx-auto mb-3 opacity-30" />
                                <p className="font-semibold text-gray-600">No prescription orders found</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Prescriptions created by doctors during consultations will automatically appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredPrescriptions.map((order) => {
                                    const isOrderFullyDispensed = order.pendingCount === 0;

                                    return (
                                        <div
                                            key={order.id || order.recordId}
                                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition space-y-4"
                                        >
                                            {/* Order Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold text-gray-800 text-base">
                                                                {order.patient?.firstName} {order.patient?.lastName}
                                                            </h3>
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-gray-100 text-gray-600">
                                                                MRN-{String(order.patient?.id || order.patient?._id || "").padStart(4, "0")}
                                                            </span>
                                                            {order.patient?.gender && (
                                                                <span className="text-xs text-gray-400">· {order.patient.gender}</span>
                                                            )}
                                                            {order.patient?.bloodGroup && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-coral-50 text-coral-600">
                                                                    {order.patient.bloodGroup}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
                                                            <span>Phone: {order.patient?.phone || "N/A"}</span>
                                                            <span>·</span>
                                                            <span>
                                                                Prescribed: {new Date(order.recordDate || order.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                                            isOrderFullyDispensed
                                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                : "bg-amber-50 text-amber-700 border border-amber-200"
                                                        }`}
                                                    >
                                                        {isOrderFullyDispensed ? (
                                                            <>
                                                                <CheckCircle2 size={14} /> Completed
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Clock size={14} /> {order.pendingCount} Pending Item(s)
                                                            </>
                                                        )}
                                                    </span>

                                                    <button
                                                        onClick={() => openSlipModal(order)}
                                                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                                                        title="Print Prescription & Dispensation Slip"
                                                    >
                                                        <Printer size={14} /> Print Slip
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Doctor & Diagnosis Info */}
                                            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-gray-600 bg-gray-50/70 p-3 rounded-xl">
                                                <div className="flex items-center gap-1.5">
                                                    <Stethoscope size={14} className="text-primary-600" />
                                                    <span className="font-semibold text-gray-800">{order.doctor?.name}</span>
                                                    <span className="text-gray-400">({order.doctor?.specialization || "Physician"})</span>
                                                </div>
                                                {order.diagnosis && (
                                                    <div>
                                                        <span className="text-gray-400">Diagnosis: </span>
                                                        <span className="font-medium text-gray-800">{order.diagnosis}</span>
                                                    </div>
                                                )}
                                                {order.notes && (
                                                    <div>
                                                        <span className="text-gray-400">Notes: </span>
                                                        <span className="italic text-gray-600">{order.notes}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Prescribed Medications Table */}
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                                        <tr>
                                                            <th className="py-2.5 px-3">Prescribed Medicine</th>
                                                            <th className="py-2.5 px-3">Dosage & Frequency</th>
                                                            <th className="py-2.5 px-3">Duration</th>
                                                            <th className="py-2.5 px-3">Inventory Status</th>
                                                            <th className="py-2.5 px-3">Fulfillment</th>
                                                            <th className="py-2.5 px-3 text-right">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {order.prescriptions.map((rx, idx) => {
                                                            const isDispensed = rx.status === "Dispensed";
                                                            const matched = rx.matchedMedicine;

                                                            return (
                                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                                    <td className="py-3 px-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <Pill size={14} className="text-primary-500 shrink-0" />
                                                                            <span className="font-bold text-gray-800">{rx.medicineName}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-3 text-gray-600">
                                                                        {rx.dosage} · {rx.frequency}
                                                                    </td>
                                                                    <td className="py-3 px-3 text-gray-600">{rx.duration}</td>
                                                                    <td className="py-3 px-3">
                                                                        {matched ? (
                                                                            matched.quantityInStock > 0 ? (
                                                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                                                    <Check size={11} /> In Stock ({matched.quantityInStock} @ LKR{" "}
                                                                                    {matched.unitPrice})
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                                                                                    <AlertCircle size={11} /> Out of Stock (0 avail)
                                                                                </span>
                                                                            )
                                                                        ) : (
                                                                            <span className="text-[11px] text-gray-400 italic">
                                                                                No auto-match in inventory
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-3">
                                                                        {isDispensed ? (
                                                                            <div className="space-y-0.5">
                                                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                                                                    <CheckCircle2 size={12} /> Dispensed ({rx.dispensedQuantity} units)
                                                                                </span>
                                                                                {rx.dispensedAt && (
                                                                                    <p className="text-[10px] text-gray-400">
                                                                                        {new Date(rx.dispensedAt).toLocaleTimeString([], {
                                                                                            hour: "2-digit",
                                                                                            minute: "2-digit",
                                                                                        })}{" "}
                                                                                        by {rx.dispensedBy || "Pharmacist"}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                                                                                <Clock size={12} /> Pending Dispensation
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-3 text-right">
                                                                        {isDispensed ? (
                                                                            <span className="text-xs text-gray-400 font-semibold px-3 py-1">
                                                                                Fulfilled
                                                                            </span>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => openProcessRxModal(order, rx)}
                                                                                className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                                                                            >
                                                                                Dispense
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL 1: ADD MEDICINE ITEM (INVENTORY) */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Medicine to Inventory">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label-field">Medicine Name</label>
                        <input
                            required
                            className="input-field"
                            placeholder="e.g. Paracetamol 500mg"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-field">Form / Category</label>
                            <select
                                className="input-field"
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                            >
                                <option>Tablet</option>
                                <option>Capsule</option>
                                <option>Syrup</option>
                                <option>Injection</option>
                                <option>Ointment</option>
                                <option>Equipment</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-field">Batch Number</label>
                            <input
                                required
                                className="input-field"
                                placeholder="B-9941"
                                value={form.batchNumber}
                                onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="label-field">Initial Stock</label>
                            <input
                                type="number"
                                required
                                className="input-field"
                                value={form.quantityInStock}
                                onChange={(e) => setForm({ ...form, quantityInStock: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="label-field">Min Threshold</label>
                            <input
                                type="number"
                                required
                                className="input-field"
                                value={form.minStockLevel}
                                onChange={(e) => setForm({ ...form, minStockLevel: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="label-field">Unit Price (LKR)</label>
                            <input
                                type="number"
                                required
                                className="input-field"
                                value={form.unitPrice}
                                onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-field">Manufacturer</label>
                            <input
                                className="input-field"
                                placeholder="e.g. GSK / Pfizer"
                                value={form.manufacturer}
                                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label-field">Expiry Date</label>
                            <input
                                type="date"
                                required
                                className="input-field"
                                value={form.expiryDate}
                                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn-primary w-full">
                        Save Medicine Item
                    </button>
                </form>
            </Modal>

            {/* MODAL 2: EDIT MEDICINE ITEM */}
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Medicine Item">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="label-field">Medicine Name</label>
                        <input
                            required
                            className="input-field"
                            placeholder="e.g. Paracetamol 500mg"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-field">Form / Category</label>
                            <select
                                className="input-field"
                                value={editForm.category}
                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            >
                                <option>Tablet</option>
                                <option>Capsule</option>
                                <option>Syrup</option>
                                <option>Injection</option>
                                <option>Ointment</option>
                                <option>Equipment</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-field">Batch Number</label>
                            <input
                                required
                                className="input-field"
                                placeholder="B-9941"
                                value={editForm.batchNumber}
                                onChange={(e) => setEditForm({ ...editForm, batchNumber: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="label-field">Current Stock</label>
                            <input
                                type="number"
                                required
                                className="input-field"
                                value={editForm.quantityInStock}
                                onChange={(e) => setEditForm({ ...editForm, quantityInStock: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="label-field">Min Threshold</label>
                            <input
                                type="number"
                                required
                                className="input-field"
                                value={editForm.minStockLevel}
                                onChange={(e) => setEditForm({ ...editForm, minStockLevel: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="label-field">Unit Price (LKR)</label>
                            <input
                                type="number"
                                required
                                className="input-field"
                                value={editForm.unitPrice}
                                onChange={(e) => setEditForm({ ...editForm, unitPrice: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-field">Manufacturer</label>
                            <input
                                className="input-field"
                                placeholder="e.g. GSK / Pfizer"
                                value={editForm.manufacturer}
                                onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label-field">Expiry Date</label>
                            <input
                                type="date"
                                required
                                className="input-field"
                                value={editForm.expiryDate}
                                onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="label-field">Storage Location</label>
                        <input
                            className="input-field"
                            placeholder="e.g. Main Pharmacy / Shelf A-3"
                            value={editForm.location}
                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="submit" className="btn-primary flex-1">
                            Save Changes
                        </button>
                        <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary">
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL 3: MANUAL DISPENSE MEDICINE (INVENTORY ONLY) */}
            <Modal isOpen={dispenseModalOpen} onClose={() => setDispenseModalOpen(false)} title="Dispense Stock (Direct Sale)">
                {selectedMed && (
                    <form onSubmit={handleDispense} className="space-y-4">
                        <div className="bg-gray-50 p-3 rounded-xl space-y-1 text-sm">
                            <p className="font-bold text-gray-800">{selectedMed.name}</p>
                            <p className="text-xs text-gray-500">
                                Available Stock: <span className="font-bold text-primary-700">{selectedMed.quantityInStock} units</span>
                            </p>
                            <p className="text-xs text-gray-500">Unit Price: LKR {Number(selectedMed.unitPrice).toLocaleString()}</p>
                        </div>
                        <div>
                            <label className="label-field">Quantity to Dispense</label>
                            <input
                                type="number"
                                min={1}
                                max={selectedMed.quantityInStock}
                                required
                                className="input-field"
                                value={dispenseQty}
                                onChange={(e) => setDispenseQty(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-between items-center pt-2 font-bold text-gray-800">
                            <span>Total Charge:</span>
                            <span className="text-primary-700">
                                LKR {(Number(selectedMed.unitPrice) * Number(dispenseQty)).toLocaleString()}
                            </span>
                        </div>
                        <button type="submit" className="btn-primary w-full">
                            Confirm & Dispense Stock
                        </button>
                    </form>
                )}
            </Modal>

            {/* MODAL 4: PRESCRIPTION DISPENSE / PROCESS MODAL */}
            <Modal
                isOpen={dispenseRxModalOpen}
                onClose={() => setDispenseRxModalOpen(false)}
                title="Process & Dispense Doctor Prescription"
            >
                {selectedRxOrder && selectedRxItem && (
                    <form onSubmit={handleDispenseRxSubmit} className="space-y-4">
                        {/* Summary of Prescribed Item */}
                        <div className="bg-primary-50/70 border border-primary-100 p-4 rounded-xl space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-primary-900">Patient:</span>
                                <span className="font-bold text-gray-800">
                                    {selectedRxOrder.patient?.firstName} {selectedRxOrder.patient?.lastName}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-primary-900">Prescribing Doctor:</span>
                                <span className="text-gray-800">{selectedRxOrder.doctor?.name}</span>
                            </div>
                            <div className="border-t border-primary-200/50 pt-2">
                                <p className="font-bold text-sm text-primary-950">{selectedRxItem.medicineName}</p>
                                <p className="text-gray-600 mt-0.5">
                                    {selectedRxItem.dosage} · {selectedRxItem.frequency} · Duration: {selectedRxItem.duration}
                                </p>
                            </div>
                        </div>

                        {/* Inventory Match / Selection */}
                        <div>
                            <label className="label-field">Select Medicine from Pharmacy Stock</label>
                            <select
                                className="input-field"
                                value={dispenseRxForm.medicineId}
                                onChange={(e) => setDispenseRxForm({ ...dispenseRxForm, medicineId: e.target.value })}
                                required
                            >
                                <option value="">-- Choose inventory item --</option>
                                {medicines.map((m) => (
                                    <option key={m._id || m.id} value={m._id || m.id} disabled={m.quantityInStock <= 0}>
                                        {m.name} ({m.category}) — Stock: {m.quantityInStock} @ LKR {m.unitPrice}
                                        {m.quantityInStock <= 0 ? " [OUT OF STOCK]" : ""}
                                    </option>
                                ))}
                            </select>
                            {currentChosenMed && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Available Batch: <span className="font-mono">{currentChosenMed.batchNumber}</span> · Stock:{" "}
                                    <span className="font-bold text-emerald-700">{currentChosenMed.quantityInStock} units</span>
                                </p>
                            )}
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="label-field">Quantity to Dispense</label>
                            <input
                                type="number"
                                min={1}
                                max={currentChosenMed ? currentChosenMed.quantityInStock : 9999}
                                required
                                className="input-field"
                                value={dispenseRxForm.quantity}
                                onChange={(e) => setDispenseRxForm({ ...dispenseRxForm, quantity: Number(e.target.value) })}
                            />
                        </div>

                        {/* Price Calculation */}
                        <div className="bg-gray-50 p-3 rounded-xl flex justify-between items-center text-sm font-semibold">
                            <span className="text-gray-600">Calculated Pharmacy Charge:</span>
                            <span className="text-base font-bold text-primary-700">LKR {calculatedRxTotal.toLocaleString()}</span>
                        </div>

                        {/* Billing Integration Toggle */}
                        <label className="flex items-center gap-3 p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl cursor-pointer text-xs">
                            <input
                                type="checkbox"
                                checked={dispenseRxForm.createBill}
                                onChange={(e) => setDispenseRxForm({ ...dispenseRxForm, createBill: e.target.checked })}
                                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                            />
                            <div>
                                <span className="font-bold text-emerald-900">Auto-Generate Patient Billing Invoice</span>
                                <p className="text-emerald-700">
                                    Automatically record LKR {calculatedRxTotal.toLocaleString()} into the Patient's Billing account.
                                </p>
                            </div>
                        </label>

                        {/* Submit Actions */}
                        <div className="flex gap-2 pt-2">
                            <button
                                type="submit"
                                disabled={dispensingLoading || !currentChosenMed || currentChosenMed.quantityInStock < dispenseRxForm.quantity}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                {dispensingLoading ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={16} /> Confirm & Dispense Prescription
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setDispenseRxModalOpen(false)}
                                className="btn-secondary"
                                disabled={dispensingLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* MODAL 5: PRINTABLE PRESCRIPTION & DISPENSATION SLIP */}
            <Modal isOpen={slipModalOpen} onClose={() => setSlipModalOpen(false)} title="Prescription & Dispensation Slip">
                {selectedSlipOrder && (
                    <div className="space-y-6">
                        {/* Printable Area with Dedicated Hospital Print Formatting */}
                        <div className="printable-slip p-6 bg-white border border-gray-200 rounded-2xl space-y-6 text-gray-800">
                            {/* Hospital Header */}
                            <div className="border-b-2 border-primary-700 pb-4 flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black text-primary-800 tracking-tight">
                                        MEDICARE HOSPITAL & HEALTHCARE
                                    </h2>
                                    <p className="text-xs text-gray-500">123 Healthway Avenue, Medical City · Tel: +94 11 234 5678</p>
                                    <p className="text-xs text-gray-500">Department of Pharmacy & Clinical Pharmacology</p>
                                </div>
                                <div className="text-right">
                                    <span className="px-3 py-1 bg-primary-50 text-primary-700 font-bold rounded-lg text-xs">
                                        PRESCRIPTION SLIP
                                    </span>
                                    <p className="text-xs font-mono text-gray-600 mt-1">
                                        RX-{String(selectedSlipOrder.id || selectedSlipOrder.recordId).padStart(6, "0")}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(selectedSlipOrder.recordDate || selectedSlipOrder.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Patient & Doctor Demographics */}
                            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="space-y-1">
                                    <p className="font-bold text-gray-500 uppercase text-[10px]">Patient Information</p>
                                    <p className="font-bold text-sm text-gray-900">
                                        {selectedSlipOrder.patient?.firstName} {selectedSlipOrder.patient?.lastName}
                                    </p>
                                    <p className="text-gray-600">
                                        MRN: MRN-{String(selectedSlipOrder.patient?.id || selectedSlipOrder.patient?._id).padStart(4, "0")}
                                    </p>
                                    <p className="text-gray-600">
                                        Gender: {selectedSlipOrder.patient?.gender || "N/A"} · Blood Group:{" "}
                                        {selectedSlipOrder.patient?.bloodGroup || "N/A"}
                                    </p>
                                    <p className="text-gray-600">Contact: {selectedSlipOrder.patient?.phone || "N/A"}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="font-bold text-gray-500 uppercase text-[10px]">Prescribing Physician</p>
                                    <p className="font-bold text-sm text-gray-900">{selectedSlipOrder.doctor?.name}</p>
                                    <p className="text-gray-600">{selectedSlipOrder.doctor?.specialization || "General Medicine"}</p>
                                    <p className="text-gray-600">{selectedSlipOrder.doctor?.department || "Outpatient Department"}</p>
                                    {selectedSlipOrder.diagnosis && (
                                        <p className="text-gray-700 font-medium mt-1">Diagnosis: {selectedSlipOrder.diagnosis}</p>
                                    )}
                                </div>
                            </div>

                            {/* Prescribed Medicines Schedule */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Medications & Dosage Schedule
                                </h4>
                                <table className="w-full text-left text-xs border border-gray-200">
                                    <thead className="bg-gray-100 text-gray-700 text-[11px] uppercase">
                                        <tr>
                                            <th className="py-2 px-3 border-b">#</th>
                                            <th className="py-2 px-3 border-b">Medication</th>
                                            <th className="py-2 px-3 border-b">Dosage & Frequency</th>
                                            <th className="py-2 px-3 border-b">Duration</th>
                                            <th className="py-2 px-3 border-b">Dispensed Qty</th>
                                            <th className="py-2 px-3 border-b text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {selectedSlipOrder.prescriptions.map((p, idx) => (
                                            <tr key={idx}>
                                                <td className="py-2 px-3">{idx + 1}</td>
                                                <td className="py-2 px-3 font-bold">{p.medicineName}</td>
                                                <td className="py-2 px-3">
                                                    {p.dosage} — {p.frequency}
                                                </td>
                                                <td className="py-2 px-3">{p.duration}</td>
                                                <td className="py-2 px-3 font-semibold">
                                                    {p.status === "Dispensed" ? `${p.dispensedQuantity} units` : "—"}
                                                </td>
                                                <td className="py-2 px-3 text-right">
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            p.status === "Dispensed"
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : "bg-amber-100 text-amber-800"
                                                        }`}
                                                    >
                                                        {p.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Notes & Usage Warning */}
                            <div className="text-[11px] text-gray-500 bg-gray-50 p-3 rounded-xl space-y-1">
                                <p className="font-bold text-gray-700">Patient Usage Instructions:</p>
                                <ul className="list-disc pl-4 space-y-0.5">
                                    <li>Take medications strictly as instructed by your attending physician.</li>
                                    <li>Store in a cool, dry place away from direct sunlight and out of reach of children.</li>
                                    <li>If you experience any adverse reactions, contact hospital emergency immediately.</li>
                                </ul>
                            </div>

                            {/* Signatures */}
                            <div className="grid grid-cols-2 gap-8 pt-8 text-xs border-t border-gray-200">
                                <div>
                                    <div className="border-b border-gray-400 w-48 mb-1"></div>
                                    <p className="font-bold text-gray-800">Dispensing Pharmacist</p>
                                    <p className="text-gray-500 text-[10px]">Registered Pharmacist Stamp & Date</p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <div className="border-b border-gray-400 w-48 mb-1"></div>
                                    <p className="font-bold text-gray-800">Doctor's Verification</p>
                                    <p className="text-gray-500 text-[10px]">Attending Physician Signature</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Action Controls (hidden in print) */}
                        <div className="no-print flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => window.print()}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Printer size={16} /> Print Prescription Slip
                            </button>
                            <button
                                onClick={() => setSlipModalOpen(false)}
                                className="btn-secondary"
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

export default Pharmacy;
