import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import toast from "react-hot-toast";

const emptyForm = {
  patient: "",
  doctor: "",
  date: "",
  time: "",
  reason: "",
  status: "Pending",
};

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [aRes, pRes, dRes] = await Promise.all([
        api.get("/appointments"),
        api.get("/patients"),
        api.get("/doctors"),
      ]);
      setAppointments(aRes.data);
      setPatients(pRes.data);
      setDoctors(dRes.data);
    } catch (error) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openAddModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (appt) => {
    setForm({
      patient: appt.patient?._id,
      doctor: appt.doctor?._id,
      date: appt.date?.split("T")[0],
      time: appt.time,
      reason: appt.reason,
      status: appt.status,
    });
    setEditingId(appt._id);
    setModalOpen(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/appointments/${editingId}`, form);
        toast.success("Appointment updated");
      } else {
        await api.post("/appointments", form);
        toast.success("Appointment booked");
      }
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Cancel and remove this appointment?")) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success("Appointment removed");
      fetchAll();
    } catch (error) {
      toast.error("Failed to delete appointment");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
          <p className="text-gray-500">Book, track and manage patient appointments.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={18} /> Book Appointment
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Patient</th>
                <th className="pb-3 font-medium">Doctor</th>
                <th className="pb-3 font-medium">Date & Time</th>
                <th className="pb-3 font-medium">Reason</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="py-3 font-medium text-gray-700">
                    {a.patient?.firstName} {a.patient?.lastName}
                  </td>
                  <td className="py-3 text-gray-500">{a.doctor?.name}</td>
                  <td className="py-3 text-gray-500">
                    {new Date(a.date).toLocaleDateString()} · {a.time}
                  </td>
                  <td className="py-3 text-gray-500">{a.reason || "-"}</td>
                  <td className="py-3">
                    <Badge status={a.status} />
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(a)} className="p-2 rounded-lg bg-accent-50 text-accent-600 hover:bg-accent-100 transition">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(a._id)} className="p-2 rounded-lg bg-coral-50 text-coral-600 hover:bg-coral-100 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!appointments.length && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-12">
                    No appointments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Appointment" : "Book Appointment"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Patient</label>
            <select name="patient" required value={form.patient} onChange={handleChange} className="input-field">
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Doctor</label>
            <select name="doctor" required value={form.doctor} onChange={handleChange} className="input-field">
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} · {d.specialization}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Date</label>
              <input type="date" name="date" required value={form.date} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label-field">Time</label>
              <input name="time" required value={form.time} onChange={handleChange} className="input-field" placeholder="10:00 AM" />
            </div>
          </div>
          <div>
            <label className="label-field">Reason</label>
            <input name="reason" value={form.reason} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label-field">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="input-field">
              <option>Pending</option>
              <option>Confirmed</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full">
            {editingId ? "Update Appointment" : "Book Appointment"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Appointments;
