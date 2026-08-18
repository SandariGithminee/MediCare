import React, { useEffect, useState } from "react";
import { Plus, Trash2, Receipt as ReceiptIcon, Printer, CreditCard } from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import toast from "react-hot-toast";

const emptyForm = {
  patient: "",
  items: [{ description: "Consultation Fee", category: "Consultation", amount: 3500 }],
  paidAmount: 0,
  paymentMethod: "Cash",
  status: "Pending",
};

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [bRes, pRes] = await Promise.all([api.get("/billing"), api.get("/patients")]);
      setBills(bRes.data);
      setPatients(pRes.data);
      if (pRes.data.length) {
        setForm((prev) => ({ ...prev, patient: pRes.data[0]._id }));
      }
    } catch (error) {
      toast.error("Failed to load billing records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openAddModal = () => {
    setForm({
      ...emptyForm,
      patient: patients.length ? patients[0]._id : "",
    });
    setModalOpen(true);
  };

  const handleItemChange = (index, field, value) => {
    const items = [...form.items];
    items[index][field] = field === "amount" ? Number(value) : value;
    setForm({ ...form, items });
  };

  const addItemRow = () => {
    setForm({ ...form, items: [...form.items, { description: "", category: "Consultation", amount: 0 }] });
  };

  const removeItemRow = (index) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const totalAmount = form.items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const paidAmount = Number(form.paidAmount);
      let status = "Pending";
      if (paidAmount >= totalAmount && totalAmount > 0) status = "Paid";
      else if (paidAmount > 0) status = "Partial";

      await api.post("/billing", { ...form, totalAmount, paidAmount, status });
      toast.success("Invoice created");
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this invoice?")) return;
    try {
      await api.delete(`/billing/${id}`);
      toast.success("Invoice removed");
      fetchAll();
    } catch (error) {
      toast.error("Failed to delete invoice");
    }
  };

  const openReceipt = (bill) => {
    setSelectedBill(bill);
    setReceiptModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Billing & Invoicing</h1>
          <p className="text-gray-500">Generate itemized consultation, lab, pharmacy, and room charge receipts.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={18} /> New Invoice
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {bills.map((b) => (
            <div key={b._id} className="card hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <ReceiptIcon className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{b.invoiceNumber}</h3>
                      <p className="text-xs text-gray-400">
                        {b.patient ? `${b.patient.firstName} ${b.patient.lastName}` : "Patient"}
                      </p>
                    </div>
                  </div>
                  <Badge status={b.status} />
                </div>
                <div className="space-y-1 text-xs text-gray-500 mb-4 max-h-24 overflow-y-auto bg-gray-50 p-2.5 rounded-lg">
                  {b.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        <span className="font-semibold text-gray-700">[{it.category}]</span> {it.description}
                      </span>
                      <span className="font-semibold text-gray-800">LKR {it.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="border-t border-gray-100 pt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Total</span>
                    <span className="font-bold text-gray-800">LKR {b.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Paid Amount</span>
                    <span className="font-medium text-primary-600">LKR {b.paidAmount?.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openReceipt(b)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 py-2 rounded-lg hover:bg-primary-100 transition"
                  >
                    <Printer size={14} /> Print Receipt
                  </button>
                  <button
                    onClick={() => handleDelete(b._id)}
                    className="flex items-center justify-center gap-1 text-xs font-medium text-coral-600 bg-coral-50 px-3 py-2 rounded-lg hover:bg-coral-100 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!bills.length && (
            <p className="text-gray-400 col-span-full text-center py-16">No invoices created yet.</p>
          )}
        </div>
      )}

      {/* Modal: Create Invoice */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Generate New Invoice" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Patient</label>
            <select
              required
              value={form.patient}
              onChange={(e) => setForm({ ...form, patient: e.target.value })}
              className="input-field"
            >
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.lastName} ({p.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-field">Itemized Services & Charges</label>
            <div className="space-y-2">
              {form.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    placeholder="Description"
                    required
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    className="input-field flex-1"
                  />
                  <select
                    value={item.category}
                    onChange={(e) => handleItemChange(index, "category", e.target.value)}
                    className="input-field w-36"
                  >
                    <option>Consultation</option>
                    <option>Laboratory</option>
                    <option>Pharmacy</option>
                    <option>Admission</option>
                    <option>Other</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Amount"
                    required
                    value={item.amount}
                    onChange={(e) => handleItemChange(index, "amount", e.target.value)}
                    className="input-field w-28"
                  />
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItemRow(index)} className="text-coral-500">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addItemRow} className="text-sm text-primary-600 font-medium mt-2">
              + Add another line item
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Amount Paid Now (LKR)</label>
              <input
                type="number"
                value={form.paidAmount}
                onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="input-field"
              >
                <option>Cash</option>
                <option>Card</option>
                <option>Insurance</option>
                <option>Online</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center bg-primary-50 rounded-xl p-4">
            <span className="font-medium text-primary-700">Total Calculated Invoice</span>
            <span className="text-xl font-bold text-primary-700">LKR {totalAmount.toLocaleString()}</span>
          </div>

          <button type="submit" className="btn-primary w-full">
            Save Invoice Record
          </button>
        </form>
      </Modal>

      {/* Modal: Printable Receipt */}
      <Modal isOpen={receiptModalOpen} onClose={() => setReceiptModalOpen(false)} title="Official Payment Receipt">
        {selectedBill && (
          <div className="space-y-6 p-4 bg-white border border-gray-200 rounded-xl">
            <div className="flex justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-primary-700">MEDICARE HOSPITAL SYSTEM</h2>
                <p className="text-xs text-gray-500">Official Patient Billing Receipt</p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p className="font-mono font-bold text-gray-800">{selectedBill.invoiceNumber}</p>
                <p>Date: {new Date(selectedBill.date || selectedBill.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="text-sm">
              <span className="text-xs text-gray-400">PATIENT NAME</span>
              <p className="font-bold text-gray-800">
                {selectedBill.patient ? `${selectedBill.patient.firstName} ${selectedBill.patient.lastName}` : "Patient"}
              </p>
              <p className="text-xs text-gray-500">Phone: {selectedBill.patient?.phone}</p>
            </div>

            <table className="w-full text-left text-xs border-t border-b border-gray-100">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="py-2 px-3">Item Description</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedBill.items?.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 font-medium text-gray-800">{it.description}</td>
                    <td className="py-2 px-3 text-gray-500">{it.category}</td>
                    <td className="py-2 px-3 text-right font-bold text-gray-800">LKR {it.amount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold">LKR {selectedBill.totalAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-700">LKR {selectedBill.paidAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-bold text-gray-800">
                <span>Balance Due:</span>
                <span>LKR {(selectedBill.totalAmount - selectedBill.paidAmount).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button onClick={() => window.print()} className="btn-primary text-xs flex items-center gap-1.5">
                <Printer size={14} /> Print Receipt / Invoice
              </button>
              <button onClick={() => setReceiptModalOpen(false)} className="text-xs font-semibold text-gray-500 hover:text-gray-700">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Billing;
