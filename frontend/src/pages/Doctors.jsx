import React, { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Phone, Star, Clock, AlertCircle } from "lucide-react";
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

const validateDoctor = (data) => {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = "Doctor name is required.";
  } else if (data.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (!data.specialization || !data.specialization.trim()) {
    errors.specialization = "Specialization is required.";
  }

  if (!data.department || !data.department.trim()) {
    errors.department = "Department is required.";
  }

  const rawDigits = (data.phone || "").replace(/\D/g, "");
  if (!data.phone || !data.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!/^[0-9\s\-()+]+$/.test(data.phone.trim())) {
    errors.phone = "Phone number can only contain digits.";
  } else if (rawDigits.length !== 10) {
    errors.phone = "Phone number must be exactly 10 digits.";
  }

  if (data.email && data.email.trim()) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(data.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
  }

  if (data.fee !== undefined && data.fee !== null && data.fee !== "") {
    if (Number(data.fee) < 0) {
      errors.fee = "Consultation fee cannot be negative.";
    }
  }

  if (data.experience !== undefined && data.experience !== null && data.experience !== "") {
    if (Number(data.experience) < 0) {
      errors.experience = "Experience cannot be negative.";
    }
  }

  return errors;
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
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const fetchDoctors = async (q = "") => {
    setLoading(true);
    try {
      const { data } = await api.get(`/doctors${q ? `?search=${q}` : ""}`);
      setDoctors(data);
    } catch (error) {
      toast.error(error.friendlyMessage || "Failed to load doctors");
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
    setErrors({});
    setTouched({});
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (doc) => {
    setForm(doc);
    setErrors({});
    setTouched({});
    setEditingId(doc._id || doc.id);
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);

    if (errors[name]) {
      const liveErrors = validateDoctor(nextForm);
      setErrors((prev) => ({ ...prev, [name]: liveErrors[name] || "" }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const currentErrors = validateDoctor(form);
    if (currentErrors[name]) {
      setErrors((prev) => ({ ...prev, [name]: currentErrors[name] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateDoctor(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const allTouched = Object.keys(form).reduce((acc, k) => ({ ...acc, [k]: true }), {});
      setTouched(allTouched);
      const firstMsg = Object.values(validationErrors)[0];
      toast.error(firstMsg || "Please correct the highlighted fields before submitting.");
      return;
    }

    try {
      if (editingId) {
        await api.put(`/doctors/${editingId}`, form);
        toast.success("Doctor details updated");
      } else {
        const photo = doctorAvatars[Math.floor(Math.random() * doctorAvatars.length)];
        await api.post("/doctors", { ...form, photo });
        toast.success("Doctor added successfully");
      }
      setModalOpen(false);
      fetchDoctors(search);
    } catch (error) {
      toast.error(error.friendlyMessage || error.response?.data?.message || "Failed to save doctor");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to remove this doctor?")) return;
    try {
      await api.delete(`/doctors/${id}`);
      toast.success("Doctor removed");
      fetchDoctors(search);
    } catch (error) {
      toast.error(error.friendlyMessage || "Failed to delete doctor");
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
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="label-field">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`input-field ${touched.name && errors.name ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20" : ""}`}
              placeholder="Dr. Jane Doe"
            />
            {touched.name && errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} className="shrink-0" /> {errors.name}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">
                Specialization <span className="text-red-500">*</span>
              </label>
              <input
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input-field ${touched.specialization && errors.specialization ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20" : ""}`}
                placeholder="e.g. Cardiologist"
              />
              {touched.specialization && errors.specialization && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.specialization}
                </p>
              )}
            </div>
            <div>
              <label className="label-field">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input-field ${touched.department && errors.department ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20" : ""}`}
                placeholder="e.g. Cardiology"
              />
              {touched.department && errors.department && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.department}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={14}
                className={`input-field ${touched.phone && errors.phone ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20" : ""}`}
                placeholder="10-digit number (e.g. 0712345678)"
              />
              {touched.phone && errors.phone && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.phone}
                </p>
              )}
            </div>
            <div>
              <label className="label-field">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input-field ${touched.email && errors.email ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20" : ""}`}
                placeholder="doctor@hospital.com"
              />
              {touched.email && errors.email && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.email}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Experience (Years)</label>
              <input
                type="number"
                name="experience"
                min="0"
                value={form.experience}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input-field ${touched.experience && errors.experience ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20" : ""}`}
              />
              {touched.experience && errors.experience && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.experience}
                </p>
              )}
            </div>
            <div>
              <label className="label-field">Consultation Fee (Rs.)</label>
              <input
                type="number"
                name="fee"
                min="0"
                value={form.fee}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input-field ${touched.fee && errors.fee ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20" : ""}`}
              />
              {touched.fee && errors.fee && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.fee}
                </p>
              )}
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
          <button type="submit" className="btn-primary w-full shadow-md hover:shadow-lg transition">
            {editingId ? "Update Doctor" : "Add Doctor"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Doctors;
