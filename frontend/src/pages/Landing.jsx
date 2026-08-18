import React from "react";
import { Link } from "react-router-dom";
import {
  HeartPulse,
  Stethoscope,
  Users,
  CalendarCheck,
  ShieldCheck,
  Activity,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Patient Management",
    desc: "Register, search and manage complete patient records with medical history in one place.",
    color: "from-primary-400 to-primary-600",
  },
  {
    icon: Stethoscope,
    title: "Doctor Directory",
    desc: "Organize doctors by department, specialization and availability with a click.",
    color: "from-accent-400 to-accent-600",
  },
  {
    icon: CalendarCheck,
    title: "Smart Appointments",
    desc: "Book, confirm and track appointments effortlessly with real-time status updates.",
    color: "from-coral-400 to-coral-500",
  },
  {
    icon: Activity,
    title: "Billing & Reports",
    desc: "Generate invoices and track revenue, pending payments and analytics instantly.",
    color: "from-amber-400 to-orange-500",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
            <HeartPulse className="text-white" size={22} />
          </div>
          <span className="font-bold text-xl text-gray-800">Medicare</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-gray-600 font-medium hover:text-primary-600 transition">
            Login
          </Link>
          <Link to="/register" className="btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-10 pb-24 grid md:grid-cols-2 gap-10 items-center">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary-200 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute top-40 right-0 w-72 h-72 bg-accent-200 rounded-full blur-3xl opacity-40"></div>

        <div className="relative z-10 animate-slide-up">
          <span className="inline-block bg-primary-50 text-primary-700 font-semibold text-sm px-4 py-1.5 rounded-full mb-5">
            🏥 Modern Hospital Management
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            Healthcare, <span className="bg-gradient-to-r from-primary-500 to-accent-600 bg-clip-text text-transparent">simplified</span> for everyone.
          </h1>
          <p className="text-gray-500 text-lg mb-8 max-w-lg">
            Medicare brings patients, doctors, appointments and billing together in
            one colorful, easy-to-use platform — built for modern hospitals.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/register" className="btn-primary flex items-center gap-2">
              Start Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary">
              I already have an account
            </Link>
          </div>

          <div className="flex items-center gap-8 mt-10">
            <div>
              <p className="text-2xl font-bold text-gray-800">10k+</p>
              <p className="text-sm text-gray-400">Patients Managed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">500+</p>
              <p className="text-sm text-gray-400">Doctors Onboard</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">99.9%</p>
              <p className="text-sm text-gray-400">Uptime</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 animate-fade-in">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
            <img
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&h=700&fit=crop"
              alt="Medical team"
              className="w-full h-[420px] object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <ShieldCheck className="text-primary-600" size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Secure & Reliable</p>
              <p className="text-xs text-gray-400">Role-based access control</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-800">Everything your hospital needs</h2>
            <p className="text-gray-500 mt-2">One platform for patients, staff and administrators.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card hover:-translate-y-1 transition-transform duration-200">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-soft`}>
                  <Icon className="text-white" size={22} />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl p-12 text-white relative overflow-hidden">
          <h2 className="text-3xl font-bold mb-3">Ready to modernize your hospital?</h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Create your free Medicare account and start managing patients, doctors and appointments today.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition">
            Create Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="text-center py-8 text-gray-400 text-sm">
        © {new Date().getFullYear()} Medicare Hospital Management System. Built with the MERN stack.
      </footer>
    </div>
  );
};

export default Landing;
