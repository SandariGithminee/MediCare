import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarCheck,
  Receipt,
  FileText,
  FlaskConical,
  Pill,
  Bed,
  UserCheck,
  BarChart3,
  ShieldCheck,
  HeartPulse,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/doctors", label: "Doctors", icon: Stethoscope },
  { to: "/appointments", label: "Appointments", icon: CalendarCheck },
  { to: "/emr", label: "Medical Records (EMR)", icon: FileText },
  { to: "/laboratory", label: "Laboratory", icon: FlaskConical },
  { to: "/pharmacy", label: "Pharmacy", icon: Pill },
  { to: "/admissions", label: "Inpatient Admissions", icon: Bed },
  { to: "/staff", label: "Staff Management", icon: UserCheck },
  { to: "/billing", label: "Billing & Receipts", icon: Receipt },
  { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/audit-logs", label: "Security Audit Logs", icon: ShieldCheck },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const navLinks = [
    links[0],
    ...(isAdmin ? [{ to: "/dashboard?tab=approvals", label: "User Approvals", icon: ShieldCheck }] : []),
    ...links.slice(1),
  ];
  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed md:static z-40 h-full w-72 bg-gradient-to-b from-primary-700 via-primary-600 to-accent-700 text-white transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 flex flex-col justify-between`}
      >
        <div>
          <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <HeartPulse className="text-white" size={22} />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-none">Medicare</h1>
                <p className="text-xs text-white/70">Hospital System</p>
              </div>
            </div>
            <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <X size={22} />
            </button>
          </div>

          <nav className="px-3 mt-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${isActive
                    ? "bg-white text-primary-700 shadow-md font-semibold"
                    : "text-white/85 hover:bg-white/10"
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm text-xs">
            <p className="font-semibold text-white">HMS Specification Compliant</p>
            <p className="text-white/70 mt-0.5">12 Core Hospital Modules Active</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
