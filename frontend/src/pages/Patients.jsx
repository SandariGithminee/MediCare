import React, { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Phone, Mail, User, AlertCircle } from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import toast from "react-hot-toast";

const calculateAgeFromDob = (dobStr) => {
  if (!dobStr) return "";
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? String(age) : "";
};

const emptyForm = {
  firstName: "",
  lastName: "",
  gender: "Male",
  dateOfBirth: "",
  age: "",
  bloodGroup: "",
  phone: "",
  email: "",
  address: "",
  emergencyContact: "",
  medicalHistory: "",
  status: "Active",
};

const validatePatient = (data) => {
  const errors = {};

  // First Name
  if (!data.firstName || !data.firstName.trim()) {
    errors.firstName = "First name is required.";
  } else if (data.firstName.trim().length < 2) {
    errors.firstName = "First name must be at least 2 characters.";
  } else if (!/^[a-zA-Z\s.'-]+$/.test(data.firstName.trim())) {
    errors.firstName = "First name can only contain letters and standard punctuation.";
  }

  // Last Name
  if (!data.lastName || !data.lastName.trim()) {
    errors.lastName = "Last name is required.";
  } else if (data.lastName.trim().length < 2) {
    errors.lastName = "Last name must be at least 2 characters.";
  } else if (!/^[a-zA-Z\s.'-]+$/.test(data.lastName.trim())) {
    errors.lastName = "Last name can only contain letters and standard punctuation.";
  }

  // Phone
  const rawDigits = (data.phone || "").replace(/\D/g, "");
  if (!data.phone || !data.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!/^[0-9\s\-()+]+$/.test(data.phone.trim())) {
    errors.phone = "Phone number can only contain digits.";
  } else if (rawDigits.length !== 10) {
    errors.phone = "Phone number must be exactly 10 digits.";
  }

  // Email (optional)
  if (data.email && data.email.trim()) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(data.email.trim())) {
      errors.email = "Please enter a valid email address (e.g. user@example.com).";
    }
  }

  // Date of Birth & Age
  const hasDob = Boolean(data.dateOfBirth);
  const hasAge = data.age !== "" && data.age !== undefined && data.age !== null;

  if (hasDob) {
    const dob = new Date(data.dateOfBirth);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (isNaN(dob.getTime())) {
      errors.dateOfBirth = "Please enter a valid calendar date.";
    } else if (dob > today) {
      errors.dateOfBirth = "Date of birth cannot be in the future.";
    }
  }

  if (hasAge) {
    const num = Number(data.age);
    if (isNaN(num) || !Number.isInteger(num) || num < 0 || num > 130) {
      errors.age = "Age must be a whole number between 0 and 130.";
    }
  }

  if (!hasDob && !hasAge) {
    errors.age = "Please provide either a Date of Birth or an Age.";
  }

  return errors;
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
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const fetchPatients = async (q = "") => {
    setLoading(true);
    try {
      const { data } = await api.get(`/patients${q ? `?search=${q}` : ""}`);
      setPatients(data);
    } catch (error) {
      toast.error(error.friendlyMessage || "Failed to load patients list.");
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
    setErrors({});
    setTouched({});
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (patient) => {
    const dob = patient.dateOfBirth ? patient.dateOfBirth.split("T")[0] : "";
    setForm({
      firstName: patient.firstName || "",
      lastName: patient.lastName || "",
      gender: patient.gender || "Male",
      dateOfBirth: dob,
      age:
        patient.age !== undefined && patient.age !== null
          ? String(patient.age)
          : dob
          ? calculateAgeFromDob(dob)
          : "",
      bloodGroup: patient.bloodGroup || "",
      phone: patient.phone || "",
      email: patient.email || "",
      address: patient.address || "",
      emergencyContact: patient.emergencyContact || "",
      medicalHistory: patient.medicalHistory || "",
      status: patient.status || "Active",
    });
    setErrors({});
    setTouched({});
    setEditingId(patient._id || patient.id);
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);

    if (errors[name]) {
      const liveErrors = validatePatient(nextForm);
      setErrors((prev) => ({
        ...prev,
        [name]: liveErrors[name] || "",
        ...(name === "age" || name === "dateOfBirth" ? { age: liveErrors.age || "", dateOfBirth: liveErrors.dateOfBirth || "" } : {}),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const currentErrors = validatePatient(form);
    if (currentErrors[name]) {
      setErrors((prev) => ({ ...prev, [name]: currentErrors[name] }));
    }
  };

  const handleDobChange = (e) => {
    const dob = e.target.value;
    const computedAge = calculateAgeFromDob(dob);
    const nextForm = {
      ...form,
      dateOfBirth: dob,
      age: computedAge !== "" ? computedAge : form.age,
    };
    setForm(nextForm);

    if (errors.dateOfBirth || errors.age) {
      const liveErrors = validatePatient(nextForm);
      setErrors((prev) => ({
        ...prev,
        dateOfBirth: liveErrors.dateOfBirth || "",
        age: liveErrors.age || "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Full form validation check
    const validationErrors = validatePatient(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Mark all fields touched to reveal error indicators
      const markAllTouched = Object.keys(form).reduce((acc, k) => ({ ...acc, [k]: true }), {});
      setTouched(markAllTouched);
      const firstMsg = Object.values(validationErrors)[0];
      toast.error(firstMsg || "Please fix the highlighted errors before submitting.");
      return;
    }

    try {
      const calculatedAge =
        form.age !== ""
          ? Number(form.age)
          : form.dateOfBirth
          ? Number(calculateAgeFromDob(form.dateOfBirth))
          : null;

      const payload = {
        ...form,
        age: calculatedAge,
      };

      if (editingId) {
        await api.put(`/patients/${editingId}`, payload);
        toast.success("Patient updated successfully.");
      } else {
        const photo = avatarPool[Math.floor(Math.random() * avatarPool.length)];
        await api.post("/patients", { ...payload, photo });
        toast.success("Patient registered successfully.");
      }
      setModalOpen(false);
      fetchPatients(search);
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors((prev) => ({ ...prev, ...error.response.data.errors }));
        const serverTouched = Object.keys(error.response.data.errors).reduce(
          (acc, k) => ({ ...acc, [k]: true }),
          {}
        );
        setTouched((prev) => ({ ...prev, ...serverTouched }));
      }
      const friendly =
        error.friendlyMessage ||
        error.response?.data?.message ||
        "Could not save patient. Please check the entered details.";
      toast.error(friendly);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to remove this patient record?")) return;
    try {
      await api.delete(`/patients/${id}`);
      toast.success("Patient removed successfully.");
      fetchPatients(search);
    } catch (error) {
      toast.error(error.friendlyMessage || "Failed to delete patient.");
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
            <div key={p._id || p.id} className="card hover:-translate-y-1 transition-transform flex flex-col justify-between">
              <div>
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
                        {p.gender}
                        {p.age !== undefined && p.age !== null ? ` · ${p.age} yrs` : ""}
                        {p.bloodGroup ? ` · ${p.bloodGroup}` : ""}
                      </p>
                    </div>
                  </div>
                  <Badge status={p.status} />
                </div>

                <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400 shrink-0" /> {p.phone}
                  </p>
                  {p.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail size={14} className="text-gray-400 shrink-0" /> {p.email}
                    </p>
                  )}
                  {p.emergencyContact && (
                    <p className="text-xs text-gray-400 pt-1 border-t border-gray-100">
                      <span className="font-medium text-gray-500">Emergency:</span> {p.emergencyContact}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => openEditModal(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-accent-600 bg-accent-50 py-2 rounded-lg hover:bg-accent-100 transition"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(p._id || p.id)}
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
        <form onSubmit={handleSubmit} noValidate className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input-field ${touched.firstName && errors.firstName ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20" : ""}`}
                placeholder="e.g. John"
              />
              {touched.firstName && errors.firstName && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.firstName}
                </p>
              )}
            </div>
            <div>
              <label className="label-field">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input-field ${touched.lastName && errors.lastName ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20" : ""}`}
                placeholder="e.g. Doe"
              />
              {touched.lastName && errors.lastName && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
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
              <input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleDobChange}
                onBlur={handleBlur}
                className={`input-field ${touched.dateOfBirth && errors.dateOfBirth ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20" : ""}`}
              />
              {touched.dateOfBirth && errors.dateOfBirth && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.dateOfBirth}
                </p>
              )}
            </div>
            <div>
              <label className="label-field">
                Age <span className="text-gray-400 font-normal">(Years)</span>
              </label>
              <input
                type="number"
                name="age"
                min="0"
                max="130"
                value={form.age}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input-field ${touched.age && errors.age ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20" : ""}`}
                placeholder="e.g. 35"
              />
              {touched.age && errors.age && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.age}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Blood Group</label>
              <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="input-field">
                <option value="">Select Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
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
                placeholder="patient@example.com"
              />
              {touched.email && errors.email && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.email}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="label-field">Emergency Contact</label>
            <input
              name="emergencyContact"
              value={form.emergencyContact}
              onChange={handleChange}
              className="input-field"
              placeholder="Name & Phone (e.g. Jane Doe +1-555-0102)"
            />
          </div>

          <div>
            <label className="label-field">Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="input-field"
              placeholder="Full residential address"
            />
          </div>

          <div>
            <label className="label-field">Medical History / Notes</label>
            <textarea
              name="medicalHistory"
              rows="2"
              value={form.medicalHistory}
              onChange={handleChange}
              className="input-field"
              placeholder="Known conditions, allergies, prior treatments..."
            />
          </div>

          <div className="pt-2">
            <button type="submit" className="btn-primary w-full shadow-md hover:shadow-lg transition">
              {editingId ? "Update Patient Details" : "Register Patient"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Patients;
