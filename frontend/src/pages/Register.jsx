import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeartPulse, Mail, Lock, User, Phone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "receptionist",
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed. Check your backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12 bg-gray-50 order-2 md:order-1">
        <div className="w-full max-w-sm animate-slide-up">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
              <HeartPulse className="text-white" size={22} />
            </div>
            <span className="font-bold text-xl text-gray-800">Medicare</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-800 mb-1">Create your account</h1>
          <p className="text-gray-500 mb-8">Join Medicare and manage your hospital smarter.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input name="name" required value={form.name} onChange={handleChange} className="input-field pl-10" placeholder="Jane Doe" />
              </div>
            </div>
            <div>
              <label className="label-field">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input type="email" name="email" required value={form.email} onChange={handleChange} className="input-field pl-10" placeholder="you@medicare.com" />
              </div>
            </div>
            <div>
              <label className="label-field">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                <input name="phone" value={form.phone} onChange={handleChange} className="input-field pl-10" placeholder="+94 77 123 4567" />
              </div>
            </div>
            <div>
              <label className="label-field">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input type="password" name="password" required minLength={6} value={form.password} onChange={handleChange} className="input-field pl-10" placeholder="At least 6 characters" />
              </div>
            </div>
            <div>
              <label className="label-field">Role</label>
              <select name="role" value={form.role} onChange={handleChange} className="input-field">
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="receptionist">Receptionist</option>
                <option value="lab">Lab Staff</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="accountant">Accountant</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-600 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden md:block relative order-1 md:order-2">
        <img
          src="https://images.unsplash.com/photo-1550831107-1553da8c8464?w=900&h=1200&fit=crop"
          alt="Doctors team"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-accent-900/80 via-accent-700/30 to-transparent"></div>
        <div className="absolute bottom-10 left-10 text-white max-w-sm">
          <h2 className="text-2xl font-bold mb-2">Join thousands of healthcare teams.</h2>
          <p className="text-white/80 text-sm">
            Set up your hospital's digital workflow in minutes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
