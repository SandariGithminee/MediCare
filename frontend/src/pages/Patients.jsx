import React, { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Phone, Mail } from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import toast from "react-hot-toast";

const emptyForm = {
  firstName: "",
  lastName: "",
  gender: "Male",
  dateOfBirth: "",
  bloodGroup: "",
  phone: "",
  email: "",
  address: "",
  status: "Active",
};

const avatarPool = [
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
];

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchPatients = async (q = "") => {
    setLoading(true);
    try {
      const { data } = await api.get(`/patients${q ? `?search=${q}` : ""}`);
      setPatients(data);
    } catch (error) {
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchPatients(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const openAddModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (patient) => {
    setForm({
      ...patient,
      dateOfBirth: patient.dateOfBirth?.split("T")[0] || "",
    });
    setEditingId(patient._id);
    setModalOpen(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/patients/${editingId}`, form);
        toast.success("Patient updated");
      } else {
        const photo = avatarPool[Math.floor(Math.random() * avatarPool.length)];
        await api.post("/patients", { ...form, photo });
        toast.success("Patient registered");
      }
      setModalOpen(false);
      fetchPatients(search);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this patient record?")) return;
    try {
      await api.delete(`/patients/${id}`);
      toast.success("Patient removed");
      fetchPatients(search);
    } catch (error) {
      toast.error("Failed to delete patient");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
          <p className="text-gray-500">Manage patient registrations and records.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={18} /> Add Patient
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          className="input-field pl-10"
          placeholder="Search by name or phone..."
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
          {patients.map((p) => (
            <div key={p._id} className="card hover:-translate-y-1 transition-transform">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={p.photo || avatarPool[0]}
                    alt={p.firstName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary-100"
                  />
                  <div>
                    <h3 className="font-bold text-gray-800">
                      {p.firstName} {p.lastName}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {p.gender} · {p.bloodGroup || "N/A"}
                    </p>
                  </div>
                </div>
                <Badge status={p.status} />
              </div>
              <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                <p className="flex items-center gap-2">
                  <Phone size={14} /> {p.phone}
                </p>
                {p.email && (
                  <p className="flex items-center gap-2">
                    <Mail size={14} /> {p.email}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-accent-600 bg-accent-50 py-2 rounded-lg hover:bg-accent-100 transition"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(p._id)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-coral-600 bg-coral-50 py-2 rounded-lg hover:bg-coral-100 transition"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
          {!patients.length && (
            <p className="text-gray-400 col-span-full text-center py-16">No patients found.</p>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Patient" : "Register Patient"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">First Name</label>
              <input name="firstName" required value={form.firstName} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label-field">Last Name</label>
              <input name="lastName" required value={form.lastName} onChange={handleChange} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="label-field">Date of Birth</label>
              <input type="date" name="dateOfBirth" required value={form.dateOfBirth} onChange={handleChange} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Blood Group</label>
              <input name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="input-field" placeholder="O+" />
            </div>
            <div>
              <label className="label-field">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="input-field">
                <option>Active</option>
                <option>Admitted</option>
                <option>Discharged</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label-field">Phone</label>
            <input name="phone" required value={form.phone} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label-field">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label-field">Address</label>
            <input name="address" value={form.address} onChange={handleChange} className="input-field" />
          </div>
          <button type="submit" className="btn-primary w-full">
            {editingId ? "Update Patient" : "Register Patient"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Patients;
