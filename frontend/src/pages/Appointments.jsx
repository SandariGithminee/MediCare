import React, { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Check,
} from "lucide-react";
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

const STATUS_COLORS = {
  Pending: "bg-amber-400",
  Confirmed: "bg-blue-500",
  Completed: "bg-emerald-500",
  Cancelled: "bg-red-400",
};

// Helper: parse 12h/24h time to total minutes
const parseTimeToMinutes = (tStr) => {
  if (!tStr) return null;
  const match = tStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let [_, h, m, ampm] = match;
  let hours = parseInt(h, 10);
  const minutes = parseInt(m, 10);
  if (ampm) {
    const period = ampm.toUpperCase();
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
  }
  return hours * 60 + minutes;
};

// Helper: convert total minutes to 12h formatted string "09:30 AM"
const formatMinutesTo12h = (totalMins) => {
  let h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
};

// Helper: generate 30-minute interval slots from "09:00 AM - 05:00 PM"
const generateDoctorTimeSlots = (rangeStr, intervalMinutes = 30) => {
  if (!rangeStr) rangeStr = "09:00 AM - 05:00 PM";
  const parts = rangeStr.split("-");
  if (parts.length !== 2) {
    return [
      "09:00 AM",
      "09:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "02:00 PM",
      "02:30 PM",
      "03:00 PM",
      "03:30 PM",
      "04:00 PM",
    ];
  }

  const startMins = parseTimeToMinutes(parts[0]);
  const endMins = parseTimeToMinutes(parts[1]);

  if (startMins === null || endMins === null || endMins <= startMins) {
    return [
      "09:00 AM",
      "09:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "02:00 PM",
      "02:30 PM",
      "03:00 PM",
      "03:30 PM",
      "04:00 PM",
    ];
  }

  const slots = [];
  for (let m = startMins; m < endMins; m += intervalMinutes) {
    slots.push(formatMinutesTo12h(m));
  }
  return slots;
};

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [viewMode, setViewMode] = useState("list"); // "list" or "calendar"
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

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
      patient: appt.patient?._id || appt.patient?.id,
      doctor: appt.doctor?._id || appt.doctor?.id,
      date: appt.date?.split("T")[0] || appt.appointmentDate?.split("T")[0],
      time: appt.time || appt.appointmentTime,
      reason: appt.reason,
      status: appt.status,
    });
    setEditingId(appt._id || appt.id);
    setModalOpen(true);
  };

  // Find currently selected doctor object
  const selectedDoctor = useMemo(() => {
    if (!form.doctor) return null;
    return (
      doctors.find(
        (d) => String(d._id) === String(form.doctor) || String(d.id) === String(form.doctor)
      ) || null
    );
  }, [doctors, form.doctor]);

  // Handle doctor selection & automatically default date if appropriate
  const handleDoctorChange = (e) => {
    const docId = e.target.value;
    const doc = doctors.find((d) => String(d._id) === String(docId) || String(d.id) === String(docId));

    let nextDate = form.date;
    let nextTime = "";

    // If date is empty or outside doctor's available days, find first available date
    if (doc) {
      const days = Array.isArray(doc.availableDays) && doc.availableDays.length > 0
        ? doc.availableDays
        : ["Mon", "Tue", "Wed", "Thu", "Fri"];

      const today = new Date();
      for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
        if (days.includes(dayName)) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          nextDate = `${yyyy}-${mm}-${dd}`;
          break;
        }
      }
    }

    setForm((prev) => ({
      ...prev,
      doctor: docId,
      date: nextDate,
      time: nextTime,
    }));
  };

  // Generate doctor's upcoming consulting dates (next 5 days on which he works)
  const availableUpcomingDates = useMemo(() => {
    if (!selectedDoctor) return [];
    const days =
      Array.isArray(selectedDoctor.availableDays) && selectedDoctor.availableDays.length > 0
        ? selectedDoctor.availableDays
        : ["Mon", "Tue", "Wed", "Thu", "Fri"];

    const list = [];
    const today = new Date();
    for (let i = 0; i < 21 && list.length < 6; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
      if (days.includes(dayName)) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const dateKey = `${yyyy}-${mm}-${dd}`;
        const label =
          i === 0
            ? "Today"
            : i === 1
            ? "Tomorrow"
            : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        list.push({ date: dateKey, label, dayName });
      }
    }
    return list;
  }, [selectedDoctor]);

  // Check if chosen date is one of doctor's working days
  const selectedDateDayName = useMemo(() => {
    if (!form.date) return null;
    const d = new Date(form.date + "T00:00:00");
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  }, [form.date]);

  const isDoctorAvailableOnSelectedDate = useMemo(() => {
    if (!selectedDoctor || !selectedDateDayName) return true;
    const days =
      Array.isArray(selectedDoctor.availableDays) && selectedDoctor.availableDays.length > 0
        ? selectedDoctor.availableDays
        : ["Mon", "Tue", "Wed", "Thu", "Fri"];
    return days.includes(selectedDateDayName);
  }, [selectedDoctor, selectedDateDayName]);

  // Generate available time slots for selected doctor
  const timeSlots = useMemo(() => {
    if (!selectedDoctor) return [];
    return generateDoctorTimeSlots(selectedDoctor.availableTime || "09:00 AM - 05:00 PM", 30);
  }, [selectedDoctor]);

  // Check if a specific time slot is already booked for this doctor on this date
  const isSlotBooked = (slot) => {
    if (!form.doctor || !form.date) return false;
    return appointments.some((a) => {
      if (editingId && (String(a._id) === String(editingId) || String(a.id) === String(editingId))) {
        return false;
      }
      const docId = a.doctor?._id || a.doctor?.id || a.doctor;
      const isSameDoc = String(docId) === String(form.doctor);
      const isSameDate = (a.date?.split("T")[0] || a.appointmentDate?.split("T")[0]) === form.date;
      const isSameTime = (a.time || a.appointmentTime) === slot;
      const isActive = a.status !== "Cancelled";
      return isSameDoc && isSameDate && isSameTime && isActive;
    });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.doctor) {
      toast.error("Please select a doctor.");
      return;
    }

    if (!form.date) {
      toast.error("Please select an appointment date.");
      return;
    }

    if (!form.time) {
      toast.error("Please select one of the doctor's available time slots.");
      return;
    }

    if (isSlotBooked(form.time)) {
      toast.error("This time slot is already booked. Please choose another slot.");
      return;
    }

    try {
      if (editingId) {
        await api.put(`/appointments/${editingId}`, form);
        toast.success("Appointment updated");
      } else {
        await api.post("/appointments", form);
        toast.success("Appointment booked successfully");
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

  // ---- Calendar helpers ----
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleString("default", { month: "long", year: "numeric" });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));
  const goToToday = () => setCalendarDate(new Date());

  // Group appointments by date string (YYYY-MM-DD)
  const apptsByDate = {};
  appointments.forEach((a) => {
    const d = a.date?.split("T")[0] || a.appointmentDate?.split("T")[0];
    if (d) {
      if (!apptsByDate[d]) apptsByDate[d] = [];
      apptsByDate[d].push(a);
    }
  });

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const formatDateKey = (day) => {
    const m = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${m}-${dd}`;
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const selectedDateStr = selectedDay ? formatDateKey(selectedDay) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
          <p className="text-gray-500">Schedule and manage patient doctor appointments.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                viewMode === "list" ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <List size={16} /> List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                viewMode === "calendar" ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <CalendarDays size={16} /> Calendar
            </button>
          </div>
          <button onClick={openAddModal} className="btn-primary flex items-center gap-2 w-fit shadow-md">
            <Plus size={18} /> Book Appointment
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      ) : viewMode === "list" ? (
        /* ========== LIST VIEW ========== */
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-medium">Patient</th>
                <th className="pb-3 font-medium">Doctor</th>
                <th className="pb-3 font-medium">Date & Time Slot</th>
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
                  <td className="py-3 text-gray-600">
                    <div>{a.doctor?.name}</div>
                    <div className="text-xs text-accent-600">{a.doctor?.specialization}</div>
                  </td>
                  <td className="py-3 text-gray-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-primary-600" />
                      {new Date(a.date || a.appointmentDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md mt-1 border border-primary-100">
                      <Clock size={11} /> {a.time || a.appointmentTime}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{a.reason || "-"}</td>
                  <td className="py-3">
                    <Badge status={a.status} />
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(a)}
                        className="p-2 rounded-lg bg-accent-50 text-accent-600 hover:bg-accent-100 transition"
                        title="Edit appointment"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(a._id)}
                        className="p-2 rounded-lg bg-coral-50 text-coral-600 hover:bg-coral-100 transition"
                        title="Cancel appointment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!appointments.length && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-12">
                    No appointments booked yet. Click "Book Appointment" above to schedule one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ========== CALENDAR VIEW ========== */
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-5">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-800">{monthName}</h3>
                <button onClick={goToToday} className="text-xs text-primary-600 font-medium hover:underline">
                  Go to Today
                </button>
              </div>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="h-20" />;

                const dateKey = formatDateKey(day);
                const dayAppts = apptsByDate[dateKey] || [];
                const isToday = dateKey === todayStr;
                const isSelected = dateKey === selectedDateStr;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`h-20 p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? "border-primary-500 bg-primary-50/50 shadow-sm"
                        : isToday
                        ? "border-accent-300 bg-accent-50/30"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? "bg-accent-600 text-white"
                          : isSelected
                          ? "bg-primary-600 text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {day}
                    </span>

                    {/* Appointment dots / mini pills */}
                    <div className="space-y-0.5 w-full overflow-hidden">
                      {dayAppts.slice(0, 2).map((a) => (
                        <div
                          key={a._id}
                          className="text-[10px] truncate px-1 py-0.5 rounded bg-white font-medium text-gray-600 border border-gray-100 flex items-center gap-1 shadow-xs"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_COLORS[a.status] || "bg-gray-400"}`} />
                          <span className="truncate">{a.time || a.appointmentTime} {a.doctor?.name?.split(" ")[1] || ""}</span>
                        </div>
                      ))}
                      {dayAppts.length > 2 && (
                        <p className="text-[9px] text-gray-400 font-medium pl-1">
                          +{dayAppts.length - 2} more
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Details Panel */}
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">
                {selectedDateStr ? new Date(selectedDateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "Day's Appointments"}
              </h3>
              {selectedDateStr && (
                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                  {(apptsByDate[selectedDateStr] || []).length} booked
                </span>
              )}
            </div>

            {selectedDateStr ? (
              (apptsByDate[selectedDateStr] || []).length > 0 ? (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {apptsByDate[selectedDateStr].map((a) => (
                    <div
                      key={a._id}
                      className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {a.patient?.firstName} {a.patient?.lastName}
                          </p>
                          <p className="text-xs text-primary-600 font-medium mt-0.5 flex items-center gap-1">
                            <Clock size={11} /> {a.time || a.appointmentTime} · {a.doctor?.name}
                          </p>
                          {a.reason && (
                            <p className="text-xs text-gray-500 mt-1">{a.reason}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge status={a.status} />
                          <button
                            onClick={() => openEditModal(a)}
                            className="p-1.5 rounded-lg hover:bg-accent-50 text-accent-600 transition"
                          >
                            <Pencil size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm py-8 text-center">
                  No appointments scheduled on this day.
                </p>
              )
            ) : (
              <p className="text-gray-400 text-sm py-8 text-center">
                Click on any calendar day to inspect its scheduled appointments.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========== BOOK / EDIT APPOINTMENT MODAL ========== */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Appointment Details" : "Book New Appointment"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Selector */}
          <div>
            <label className="label-field">
              Patient <span className="text-red-500">*</span>
            </label>
            <select
              name="patient"
              required
              value={form.patient}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Choose patient...</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.lastName} {p.phone ? `(${p.phone})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Selector */}
          <div>
            <label className="label-field">
              Doctor <span className="text-red-500">*</span>
            </label>
            <select
              name="doctor"
              required
              value={form.doctor}
              onChange={handleDoctorChange}
              className="input-field font-medium"
            >
              <option value="">Select consulting doctor...</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} — {d.specialization} ({d.department})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Doctor Availability Card */}
          {selectedDoctor && (
            <div className="bg-primary-50/50 border border-primary-100 rounded-xl p-3 text-xs space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope size={14} className="text-primary-600" />
                  <span className="font-bold text-gray-800">{selectedDoctor.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 text-[10px] font-semibold">
                    {selectedDoctor.department}
                  </span>
                </div>
                <span className="font-semibold text-gray-700">
                  Fee: Rs. {selectedDoctor.fee || selectedDoctor.consultationFee || 0}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-600 pt-1 border-t border-primary-100/60">
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-primary-600" />
                  <strong>Consulting Days:</strong>{" "}
                  {Array.isArray(selectedDoctor.availableDays) && selectedDoctor.availableDays.length > 0
                    ? selectedDoctor.availableDays.join(", ")
                    : "Mon, Tue, Wed, Thu, Fri"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-accent-600" />
                  <strong>Hours:</strong> {selectedDoctor.availableTime || "09:00 AM - 05:00 PM"}
                </span>
              </div>
            </div>
          )}

          {/* Appointment Date Selection */}
          <div>
            <label className="label-field">
              Appointment Date <span className="text-red-500">*</span>
            </label>

            {/* Quick Upcoming Available Dates Chips */}
            {selectedDoctor && availableUpcomingDates.length > 0 && (
              <div className="mb-2">
                <span className="text-[11px] text-gray-400 block mb-1.5 font-medium">
                  Next Available Consulting Dates for {selectedDoctor.name}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {availableUpcomingDates.map((item) => {
                    const isChosen = form.date === item.date;
                    return (
                      <button
                        key={item.date}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, date: item.date, time: "" }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                          isChosen
                            ? "bg-primary-600 text-white shadow-xs"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                        }`}
                      >
                        {isChosen && <Check size={11} />}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <input
              type="date"
              name="date"
              required
              min={todayStr}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value, time: "" })}
              className="input-field"
            />

            {/* Day Warning if Selected Date is NOT one of doctor's working days */}
            {selectedDoctor && form.date && !isDoctorAvailableOnSelectedDate && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1 bg-amber-50 p-2 rounded-lg border border-amber-200">
                <AlertCircle size={13} className="shrink-0" />
                <span>
                  Notice: {selectedDoctor.name} is usually scheduled on{" "}
                  <strong>
                    {Array.isArray(selectedDoctor.availableDays)
                      ? selectedDoctor.availableDays.join(", ")
                      : "weekdays"}
                  </strong>
                  .
                </span>
              </p>
            )}
          </div>

          {/* ========== DYNAMIC TIME SLOT SELECTION ========== */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label-field mb-0">
                Available Time Slot <span className="text-red-500">*</span>
              </label>
              {form.time && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Selected: {form.time}
                </span>
              )}
            </div>

            {!form.doctor ? (
              <div className="text-center py-6 border border-dashed rounded-xl bg-gray-50 text-gray-400 text-xs">
                Select a doctor above to view available time slots.
              </div>
            ) : !form.date ? (
              <div className="text-center py-6 border border-dashed rounded-xl bg-gray-50 text-gray-400 text-xs">
                Select an appointment date above to view time slots.
              </div>
            ) : timeSlots.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50/70 rounded-xl border border-gray-200">
                  {timeSlots.map((slot) => {
                    const booked = isSlotBooked(slot);
                    const isSelected = form.time === slot;

                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={booked}
                        onClick={() => setForm((prev) => ({ ...prev, time: slot }))}
                        className={`py-2 px-1 rounded-lg text-xs font-semibold text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                          isSelected
                            ? "bg-primary-600 text-white shadow-sm ring-2 ring-primary-300 scale-102"
                            : booked
                            ? "bg-gray-100 text-gray-400 border border-gray-200 line-through cursor-not-allowed opacity-60"
                            : "bg-white text-gray-700 border border-gray-200 hover:border-primary-400 hover:bg-primary-50/50 shadow-2xs"
                        }`}
                        title={booked ? "This slot is already booked" : `Select ${slot}`}
                      >
                        <span className="flex items-center gap-1">
                          <Clock size={11} className={isSelected ? "text-white" : "text-gray-400"} />
                          {slot}
                        </span>
                        {booked && <span className="text-[9px] text-red-500 font-normal">Booked</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
                  <span>30-minute consultation slots</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-white border border-gray-400" /> Available
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-300" /> Booked
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary-600" /> Selected
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-3 text-center">No time slots found for this doctor.</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="label-field">Reason for Visit</label>
            <input
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="e.g. Routine checkup, joint pain, vaccination..."
              className="input-field"
            />
          </div>

          {/* Status */}
          <div>
            <label className="label-field">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="input-field">
              <option>Pending</option>
              <option>Confirmed</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>

          <button type="submit" className="btn-primary w-full shadow-md hover:shadow-lg transition">
            {editingId ? "Update Appointment" : "Confirm Appointment Booking"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Appointments;
