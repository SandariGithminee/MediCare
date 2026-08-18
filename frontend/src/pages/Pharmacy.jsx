import React, { useEffect, useState } from "react";
import { Plus, Search, Pill, AlertTriangle, Clock, ShoppingCart, PackageCheck, Trash2, Edit3 } from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";
import toast from "react-hot-toast";

const Pharmacy = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
    const [selectedMed, setSelectedMed] = useState(null);
    const [dispenseQty, setDispenseQty] = useState(1);

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

    const fetchMedicines = async (q = "") => {
        setLoading(true);
        try {
            const { data } = await api.get(`/pharmacy${q ? `?search=${q}` : ""}`);
            setMedicines(data);
        } catch (error) {
            toast.error("Failed to load pharmacy inventory");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedicines();
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
            await api.post(`/pharmacy/${selectedMed._id}/dispense`, { quantity: Number(dispenseQty) });
            toast.success(`Dispensed ${dispenseQty} units of ${selectedMed.name}`);
            setDispenseModalOpen(false);
            fetchMedicines(search);
        } catch (error) {
            toast.error(error.response?.data?.message || "Dispense failed");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Remove this medicine item from pharmacy database?")) return;
        try {
            await api.delete(`/pharmacy/${id}`);
            toast.success("Medicine removed");
            fetchMedicines(search);
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    const lowStockCount = medicines.filter((m) => m.quantityInStock <= m.minStockLevel).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Pharmacy Management</h1>
                    <p className="text-gray-500">Track medicine inventory, stock reorders, expiry dates, and dispensing.</p>
                </div>
                <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 w-fit">
                    <Plus size={18} /> Add Medicine Item
                </button>
            </div>

            {lowStockCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800 text-sm">
                    <AlertTriangle className="text-amber-600 shrink-0" size={22} />
                    <div>
                        <span className="font-bold">{lowStockCount} Medicine(s) Low on Stock!</span>
                        <p className="text-xs text-amber-700">Please review inventory levels below and place stock replenishment orders.</p>
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
                                        <tr key={m._id} className="hover:bg-gray-50/50 transition-colors">
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
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${isLow ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700"
                                                        }`}
                                                >
                                                    {m.quantityInStock} units {isLow && "(Low)"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-800">LKR {m.unitPrice.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-xs text-gray-500">
                                                {new Date(m.expiryDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => openDispenseModal(m)}
                                                    className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-semibold rounded-lg transition"
                                                >
                                                    Dispense
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(m._id)}
                                                    className="px-2.5 py-1.5 text-coral-600 hover:bg-coral-50 rounded-lg transition"
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

            {/* Modal: Add Medicine */}
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

            {/* Modal: Dispense Medicine */}
            <Modal isOpen={dispenseModalOpen} onClose={() => setDispenseModalOpen(false)} title="Dispense Prescription Medicine">
                {selectedMed && (
                    <form onSubmit={handleDispense} className="space-y-4">
                        <div className="bg-gray-50 p-3 rounded-xl space-y-1 text-sm">
                            <p className="font-bold text-gray-800">{selectedMed.name}</p>
                            <p className="text-xs text-gray-500">Available Stock: <span className="font-bold text-primary-700">{selectedMed.quantityInStock} units</span></p>
                            <p className="text-xs text-gray-500">Unit Price: LKR {selectedMed.unitPrice}</p>
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
                            <span className="text-primary-700">LKR {(selectedMed.unitPrice * Number(dispenseQty)).toLocaleString()}</span>
                        </div>
                        <button type="submit" className="btn-primary w-full">
                            Confirm & Dispense Stock
                        </button>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default Pharmacy;
