import React, { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Phone,
  Star,
  Clock,
  AlertCircle,
  Calendar,
  Check,
  LayoutGrid,
  CalendarDays,
  Building2,
  Stethoscope,
} from "lucide-react";
import api from "../api/axios";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import toast from "react-hot-toast";

const STANDARD_DEPARTMENTS = [
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "General Medicine",
  "Gynecology & Obstetrics",
  "Dermatology",
  "ENT",
  "Radiology",
  "General Surgery",
  "Emergency",
];

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Convert 24-hour "09:00" to 12-hour "09:00 AM"
const format24to12 = (time24) => {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
};

// Convert 12-hour "09:00 AM" to 24-hour "09:00"
const format12to24 = (time12) => {
  if (!time12) return "";
  const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return "";
  let [_, hStr, mStr, ampm] = match;
  let h = parseInt(hStr, 10);
  if (ampm) {
    ampm = ampm.toUpperCase();
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
  }
  return `${String(h).padStart(2, "0")}:${mStr}`;
};

// Parse range "09:00 AM - 05:00 PM" -> { startTime: "09:00", endTime: "17:00" }
const parseAvailableTimeTo24 = (rangeStr) => {
  if (!rangeStr || !rangeStr.includes("-")) {
    return { startTime: "09:00", endTime: "17:00" };
  }
  const [s, e] = rangeStr.split("-");
  const startTime = format12to24(s) || "09:00";
  const endTime = format12to24(e) || "17:00";
  return { startTime, endTime };
};

const emptyForm = {
  name: "",
  specialization: "",
  department: "General Medicine",
  customDepartment: "",
  phone: "",
  email: "",
  experience: 0,
  fee: 0,
  availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  startTime: "09:00",
  endTime: "17:00",
  availableTime: "09:00 AM - 05:00 PM",
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
  } else if (data.department === "Other" && (!data.customDepartment || !data.customDepartment.trim())) {
    errors.department = "Please specify the custom department name.";
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

  if (!data.availableDays || data.availableDays.length === 0) {
    errors.availableDays = "Please select at least one consulting day for the doctor.";
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
  const [selectedDept, setSelectedDept] = useState("All");
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "schedule"
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const fetchDoctors = async (q = "") => {
    setLoading(true);
    try {
      const { data } = await api.get(`/doctors${q ? `?search=${q}` : ""}`);
      const list = Array.isArray(data) ? data : (Array.isArray(data?.doctors) ? data.doctors : []);
      setDoctors(list);
    } catch (error) {
      setDoctors([]);
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

  // Unique departments for filter chips
  const departmentFilterList = useMemo(() => {
    const depts = new Set();
    const safeDocs = Array.isArray(doctors) ? doctors : [];
    safeDocs.forEach((d) => {
      if (d && d.department) depts.add(d.department);
    });
    return ["All", ...Array.from(depts)];
  }, [doctors]);

  // Filtered doctors list
  const filteredDoctors = useMemo(() => {
    const safeDocs = Array.isArray(doctors) ? doctors : [];
    return safeDocs.filter((d) => {
      if (!d) return false;
      if (selectedDept !== "All" && d.department !== selectedDept) {
        return false;
      }
      return true;
    });
  }, [doctors, selectedDept]);

  const openAddModal = () => {
    setForm(emptyForm);
    setErrors({});
    setTouched({});
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (doc) => {
    const isStandardDept = STANDARD_DEPARTMENTS.includes(doc.department);
    const { startTime, endTime } = parseAvailableTimeTo24(doc.availableTime || "09:00 AM - 05:00 PM");
    setForm({
      ...emptyForm,
      ...doc,
      department: isStandardDept ? doc.department : "Other",
      customDepartment: isStandardDept ? "" : doc.department || "",
      fee:
        doc.fee !== undefined && doc.fee !== null
          ? doc.fee
          : doc.consultationFee !== undefined && doc.consultationFee !== null
          ? doc.consultationFee
          : 0,
      experience: doc.experience !== undefined && doc.experience !== null ? doc.experience : 0,
      availableDays:
        Array.isArray(doc.availableDays) && doc.availableDays.length > 0
          ? doc.availableDays
          : ["Mon", "Tue", "Wed", "Thu", "Fri"],
      startTime,
      endTime,
      availableTime: doc.availableTime || `${format24to12(startTime)} - ${format24to12(endTime)}`,
      status: doc.status || "Active",
    });
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

  const handleTimeChange = (field, value) => {
    const nextStartTime = field === "startTime" ? value : form.startTime || "09:00";
    const nextEndTime = field === "endTime" ? value : form.endTime || "17:00";
    const s12 = format24to12(nextStartTime);
    const e12 = format24to12(nextEndTime);
    const formatted = `${s12} - ${e12}`;

    setForm((prev) => ({
      ...prev,
      [field]: value,
      availableTime: formatted,
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const currentErrors = validateDoctor(form);
    if (currentErrors[name]) {
      setErrors((prev) => ({ ...prev, [name]: currentErrors[name] }));
    }
  };

  const toggleDay = (day) => {
    const current = form.availableDays || [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    const nextForm = { ...form, availableDays: updated };
    setForm(nextForm);

    if (errors.availableDays) {
      const liveErrors = validateDoctor(nextForm);
      setErrors((prev) => ({ ...prev, availableDays: liveErrors.availableDays || "" }));
    }
  };

  const selectWeekdays = () => {
    setForm((prev) => ({ ...prev, availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] }));
    setErrors((prev) => ({ ...prev, availableDays: "" }));
  };

  const selectAllDays = () => {
    setForm((prev) => ({ ...prev, availableDays: [...DAYS_OF_WEEK] }));
    setErrors((prev) => ({ ...prev, availableDays: "" }));
  };

  const clearDays = () => {
    setForm((prev) => ({ ...prev, availableDays: [] }));
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

    const finalDepartment =
      form.department === "Other"
        ? form.customDepartment.trim()
        : form.department || "General Medicine";

    const s12 = format24to12(form.startTime || "09:00");
    const e12 = format24to12(form.endTime || "17:00");
    const finalAvailableTime = `${s12} - ${e12}`;

    const payload = {
      ...form,
      department: finalDepartment,
      availableDays: form.availableDays && form.availableDays.length > 0 ? form.availableDays : ["Mon", "Wed", "Fri"],
      availableTime: finalAvailableTime,
    };

    try {
      if (editingId) {
        await api.put(`/doctors/${editingId}`, payload);
        toast.success("Doctor details & schedule updated");
      } else {
        const photo = doctorAvatars[Math.floor(Math.random() * doctorAvatars.length)];
        await api.post("/doctors", { ...payload, photo });
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
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Doctor Management</h1>
          <p className="text-gray-500">Manage doctors, departmental assignments, and flexible consulting schedules.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Switcher: Cards vs Schedule */}
          <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                viewMode === "cards"
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutGrid size={16} /> Doctors
            </button>
            <button
              type="button"
              onClick={() => setViewMode("schedule")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                viewMode === "schedule"
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <CalendarDays size={16} /> Schedule Roster
            </button>
          </div>

          <button onClick={openAddModal} className="btn-primary flex items-center gap-2 w-fit">
            <Plus size={18} /> Add Doctor
          </button>
        </div>
      </div>

      {/* Search Bar & Department Filter Chips */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            className="input-field pl-10"
            placeholder="Search by name, specialization, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Department Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-gray-400 font-medium shrink-0 flex items-center gap-1 mr-1">
            <Building2 size={14} /> Department:
          </span>
          {departmentFilterList.map((dept) => {
            const isSelected = selectedDept === dept;
            const count =
              dept === "All"
                ? doctors.length
                : doctors.filter((d) => d.department === dept).length;
            return (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1 rounded-full font-medium transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {dept}
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? "bg-white/25 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      ) : viewMode === "cards" ? (
        /* ========== DOCTOR CARDS VIEW ========== */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((d) => (
            <div key={d._id} className="card hover:-translate-y-1 transition-transform border border-gray-100 flex flex-col justify-between">
              <div>
                {/* Doctor Header */}
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
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                        {d.department}
                      </span>
                    </div>
                  </div>
                  <Badge status={d.status} />
                </div>

                {/* Rating & Experience */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1 font-medium text-amber-600">
                    <Star size={14} className="text-amber-400 fill-amber-400" />{" "}
                    {d.rating !== undefined && d.rating !== null ? d.rating : 4.8}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} className="text-gray-400" />{" "}
                    {d.experience !== undefined && d.experience !== null ? d.experience : 0} yrs exp
                  </span>
                </div>

                {/* Phone */}
                <p className="text-sm text-gray-500 flex items-center gap-2 mb-3">
                  <Phone size={14} className="text-gray-400" /> {d.phone || "No phone"}
                </p>

                {/* Schedule & Availability Box */}
                <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span className="font-semibold text-gray-700 flex items-center gap-1">
                      <Calendar size={13} className="text-primary-600" /> Consulting Days
                    </span>
                    <span className="text-gray-600 font-medium flex items-center gap-1 text-[11px]">
                      <Clock size={11} className="text-accent-600" /> {d.availableTime || "09:00 AM - 05:00 PM"}
                    </span>
                  </div>
                  <div className="flex gap-1 justify-between">
                    {DAYS_OF_WEEK.map((day) => {
                      const active = Array.isArray(d.availableDays) && d.availableDays.includes(day);
                      return (
                        <span
                          key={day}
                          className={`flex-1 text-center py-1 rounded text-[10px] font-bold transition ${
                            active
                              ? "bg-primary-600 text-white shadow-xs"
                              : "bg-gray-200/70 text-gray-400"
                          }`}
                          title={`${day}: ${active ? "Available" : "Off Duty"}`}
                        >
                          {day}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Fee */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-sm text-gray-400">Consultation Fee</span>
                  <span className="font-bold text-gray-800 text-base">
                    Rs.{" "}
                    {d.fee !== undefined && d.fee !== null
                      ? d.fee
                      : d.consultationFee !== undefined && d.consultationFee !== null
                      ? d.consultationFee
                      : 0}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
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
          {!filteredDoctors.length && (
            <div className="col-span-full text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Stethoscope className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="text-gray-500 font-medium">No doctors found matching your criteria.</p>
              <p className="text-xs text-gray-400 mt-1">Try choosing another department or modifying the search.</p>
            </div>
          )}
        </div>
      ) : (
        /* ========== WEEKLY SCHEDULE ROSTER VIEW ========== */
        <div className="card overflow-x-auto border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CalendarDays size={20} className="text-primary-600" /> Weekly Consulting Roster
              </h2>
              <p className="text-xs text-gray-400">Overview of doctor availability by day of the week.</p>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
              Total Doctors: {filteredDoctors.length}
            </span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100 bg-gray-50/50">
                <th className="py-3 px-3 font-medium">Doctor</th>
                <th className="py-3 px-3 font-medium">Department</th>
                <th className="py-3 px-3 font-medium">Consulting Hours</th>
                {DAYS_OF_WEEK.map((day) => (
                  <th key={day} className="py-3 px-2 font-medium text-center">
                    {day}
                  </th>
                ))}
                <th className="py-3 px-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map((doc) => (
                <tr key={doc._id} className="border-b border-gray-50 hover:bg-gray-50/80 transition">
                  <td className="py-3 px-3 font-semibold text-gray-800">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={doc.photo || doctorAvatars[0]}
                        alt={doc.name}
                        className="w-8 h-8 rounded-full object-cover border"
                      />
                      <div>
                        <div>{doc.name}</div>
                        <div className="text-xs font-normal text-gray-400">{doc.specialization}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                      {doc.department}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-600 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-accent-500" /> {doc.availableTime || "09:00 AM - 05:00 PM"}
                    </span>
                  </td>
                  {DAYS_OF_WEEK.map((day) => {
                    const isAvailable = Array.isArray(doc.availableDays) && doc.availableDays.includes(day);
                    return (
                      <td key={day} className="py-3 px-2 text-center">
                        {isAvailable ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            On Duty
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300 font-bold">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => openEditModal(doc)}
                      className="px-2.5 py-1 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition"
                    >
                      Edit Schedule
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredDoctors.length && (
                <tr>
                  <td colSpan={11} className="text-center text-gray-400 py-12">
                    No doctors found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========== ADD / EDIT DOCTOR MODAL ========== */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Update Doctor & Schedule" : "Add New Doctor"}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="label-field">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`input-field ${
                touched.name && errors.name ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20" : ""
              }`}
              placeholder="Dr. Jane Doe"
            />
            {touched.name && errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} className="shrink-0" /> {errors.name}
              </p>
            )}
          </div>

          {/* Specialization & Department Assignment */}
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
                className={`input-field ${
                  touched.specialization && errors.specialization
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20"
                    : ""
                }`}
                placeholder="e.g. Cardiologist"
              />
              {touched.specialization && errors.specialization && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.specialization}
                </p>
              )}
            </div>

            {/* Department Assignment Dropdown */}
            <div>
              <label className="label-field">
                Department Assignment <span className="text-red-500">*</span>
              </label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input-field ${
                  touched.department && errors.department
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20"
                    : ""
                }`}
              >
                {STANDARD_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
                <option value="Other">Other (Custom Department)...</option>
              </select>
              {form.department === "Other" && (
                <input
                  name="customDepartment"
                  value={form.customDepartment || ""}
                  onChange={handleChange}
                  placeholder="Specify department name..."
                  className="input-field mt-2"
                />
              )}
              {touched.department && errors.department && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.department}
                </p>
              )}
            </div>
          </div>

          {/* Phone & Email */}
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
                className={`input-field ${
                  touched.phone && errors.phone
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20"
                    : ""
                }`}
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
                className={`input-field ${
                  touched.email && errors.email
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20"
                    : ""
                }`}
                placeholder="doctor@hospital.com"
              />
              {touched.email && errors.email && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Experience & Fee */}
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
                className={`input-field ${
                  touched.experience && errors.experience
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20"
                    : ""
                }`}
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
                className={`input-field ${
                  touched.fee && errors.fee
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20"
                    : ""
                }`}
              />
              {touched.fee && errors.fee && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" /> {errors.fee}
                </p>
              )}
            </div>
          </div>

          {/* ========== SCHEDULE MANAGEMENT SECTION ========== */}
          <div className="border-t border-gray-100 pt-4 space-y-3 bg-gray-50/70 p-3.5 rounded-xl border">
            <div className="flex items-center justify-between">
              <label className="label-field mb-0 flex items-center gap-1.5 font-semibold text-gray-800">
                <Calendar size={15} className="text-primary-600" />
                Weekly Consulting Days <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectWeekdays}
                  className="text-primary-600 hover:underline font-medium"
                >
                  Weekdays (Mon-Fri)
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={selectAllDays}
                  className="text-primary-600 hover:underline font-medium"
                >
                  All 7 Days
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={clearDays}
                  className="text-gray-500 hover:underline font-medium"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Days Pills */}
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = form.availableDays?.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                      isSelected
                        ? "bg-primary-600 text-white shadow-sm ring-2 ring-primary-300"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {isSelected && <Check size={12} />}
                    {day}
                  </button>
                );
              })}
            </div>
            {errors.availableDays && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} className="shrink-0" /> {errors.availableDays}
              </p>
            )}

            {/* Flexible Time Selection - Select Any Custom Working Hours */}
            <div>
              <label className="label-field flex items-center gap-1.5 font-semibold text-gray-800 mt-2">
                <Clock size={15} className="text-primary-600" />
                Consultation Working Hours (Select Any Custom Time)
              </label>
              <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
                <div>
                  <span className="text-xs text-gray-500 font-medium block mb-1">From (Start Time)</span>
                  <input
                    type="time"
                    name="startTime"
                    value={form.startTime || "09:00"}
                    onChange={(e) => handleTimeChange("startTime", e.target.value)}
                    className="input-field py-1.5 px-2 text-sm font-medium"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-medium block mb-1">To (End Time)</span>
                  <input
                    type="time"
                    name="endTime"
                    value={form.endTime || "17:00"}
                    onChange={(e) => handleTimeChange("endTime", e.target.value)}
                    className="input-field py-1.5 px-2 text-sm font-medium"
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs px-1">
                <span className="text-gray-400">Scheduled Consulting Window:</span>
                <span className="font-semibold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-100">
                  {form.availableTime || "09:00 AM - 05:00 PM"}
                </span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="label-field">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="input-field">
              <option>Active</option>
              <option>On Leave</option>
              <option>Inactive</option>
            </select>
          </div>

          <button type="submit" className="btn-primary w-full shadow-md hover:shadow-lg transition">
            {editingId ? "Update Doctor & Schedule" : "Add Doctor"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Doctors;
