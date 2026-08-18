import React, { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Phone, Star, Clock } from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import toast from "react-hot-toast";

const emptyForm = {
  name: "",
  specialization: "",
  department: "",
  phone: "",
  email: "",
  experience: 0,
  fee: 0,
  availableTime: "9:00 AM - 5:00 PM",
  status: "Active",
};

const doctorAvatars = [
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop",
];

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchDoctors = async (q = "") => {
    setLoading(true);
    try {
      const { data } = await api.get(`/doctors${q ? `?search=${q}` : ""}`);
      setDoctors(data);
    } catch (error) {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchDoctors(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const openAddModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (doc) => {
    setForm(doc);
    setEditingId(doc._id);
    setModalOpen(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/doctors/${editingId}`, form);
        toast.success("Doctor updated");
      } else {
        const photo = doctorAvatars[Math.floor(Math.random() * doctorAvatars.length)];
        await api.post("/doctors", { ...form, photo });
        toast.success("Doctor added");
      }
      setModalOpen(false);
      fetchDoctors(search);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this doctor?")) return;
    try {
      await api.delete(`/doctors/${id}`);
      toast.success("Doctor removed");
      fetchDoctors(search);
    } catch (error) {
      toast.error("Failed to delete doctor");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Doctors</h1>
          <p className="text-gray-500">Manage doctor profiles and departments.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={18} /> Add Doctor
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          className="input-field pl-10"
          placeholder="Search by name, specialization..."
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
          {doctors.map((d) => (
            <div key={d._id} className="card hover:-translate-y-1 transition-transform">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={d.photo || doctorAvatars[0]}
                    alt={d.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-accent-100"
                  />
                  <div>
                    <h3 className="font-bold text-gray-800">{d.name}</h3>
                    <p className="text-xs text-accent-600 font-medium">{d.specialization}</p>
                    <p className="text-xs text-gray-400">{d.department}</p>
                  </div>
                </div>
                <Badge status={d.status} />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Star size={14} className="text-amber-400 fill-amber-400" /> {d.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {d.experience} yrs
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-2 mb-4">
                <Phone size={14} /> {d.phone}
              </p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400">Consultation Fee</span>
                <span className="font-bold text-gray-800">Rs. {d.fee}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(d)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-accent-600 bg-accent-50 py-2 rounded-lg hover:bg-accent-100 transition"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(d._id)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-coral-600 bg-coral-50 py-2 rounded-lg hover:bg-coral-100 transition"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
          {!doctors.length && (
            <p className="text-gray-400 col-span-full text-center py-16">No doctors found.</p>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Doctor" : "Add Doctor"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Full Name</label>
            <input name="name" required value={form.name} onChange={handleChange} className="input-field" placeholder="Dr. Jane Doe" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Specialization</label>
              <input name="specialization" required value={form.specialization} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label-field">Department</label>
              <input name="department" required value={form.department} onChange={handleChange} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Phone</label>
              <input name="phone" required value={form.phone} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label-field">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Experience (yrs)</label>
              <input type="number" name="experience" value={form.experience} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="label-field">Consultation Fee</label>
              <input type="number" name="fee" value={form.fee} onChange={handleChange} className="input-field" />
            </div>
          </div>
          <div>
            <label className="label-field">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="input-field">
              <option>Active</option>
              <option>On Leave</option>
              <option>Inactive</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full">
            {editingId ? "Update Doctor" : "Add Doctor"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Doctors;
