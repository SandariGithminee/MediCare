import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, CalendarDays, List, ChevronLeft, ChevronRight } from "lucide-react";
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
    const d = a.date?.split("T")[0];
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
  const selectedDayAppointments = selectedDateStr ? (apptsByDate[selectedDateStr] || []) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
          <p className="text-gray-500">Book, track and manage patient appointments.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
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
          <button onClick={openAddModal} className="btn-primary flex items-center gap-2 w-fit">
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
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (day === null) {
                  return <div key={`empty-${i}`} className="h-20 rounded-xl" />;
                }

                const dateKey = formatDateKey(day);
                const dayAppts = apptsByDate[dateKey] || [];
                const isToday = dateKey === todayStr;
                const isSelected = selectedDay === day;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`h-20 rounded-xl border text-left p-1.5 transition-all hover:shadow-sm flex flex-col ${
                      isSelected
                        ? "border-primary-400 bg-primary-50 ring-2 ring-primary-200"
                        : isToday
                        ? "border-primary-300 bg-primary-50/50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? "bg-primary-600 text-white" : "text-gray-700"
                      }`}
                    >
                      {day}
                    </span>
                    {dayAppts.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {dayAppts.slice(0, 3).map((appt) => (
                          <span
                            key={appt._id}
                            className={`w-2 h-2 rounded-full ${STATUS_COLORS[appt.status] || "bg-gray-400"}`}
                            title={`${appt.patient?.firstName} - ${appt.status}`}
                          />
                        ))}
                        {dayAppts.length > 3 && (
                          <span className="text-[10px] text-gray-400 font-semibold">+{dayAppts.length - 3}</span>
                        )}
                      </div>
                    )}
                    {dayAppts.length > 0 && (
                      <span className="text-[10px] text-gray-500 font-medium mt-auto">
                        {dayAppts.length} appt{dayAppts.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-xs text-gray-500">{status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Day Detail Panel */}
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-4">
              {selectedDay
                ? `Appointments — ${new Date(year, month, selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`
                : "Select a Day"}
            </h3>
            {selectedDay ? (
              selectedDayAppointments.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayAppointments.map((a) => (
                    <div
                      key={a._id}
                      className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {a.patient?.firstName} {a.patient?.lastName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {a.time} · {a.doctor?.name}
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
                  No appointments on this day.
                </p>
              )
            ) : (
              <p className="text-gray-400 text-sm py-8 text-center">
                Click on a day in the calendar to view its appointments.
              </p>
            )}
          </div>
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
