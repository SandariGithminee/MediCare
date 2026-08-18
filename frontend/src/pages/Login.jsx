import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeartPulse, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("admin@medicare.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed. Check your backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block relative">
        <img
          src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=900&h=1200&fit=crop"
          alt="Hospital"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-primary-700/30 to-transparent"></div>
        <div className="absolute bottom-10 left-10 text-white max-w-sm">
          <h2 className="text-2xl font-bold mb-2">Caring for you, digitally.</h2>
          <p className="text-white/80 text-sm">
            Medicare helps hospitals manage patients, doctors and appointments with ease.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-sm animate-slide-up">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
              <HeartPulse className="text-white" size={22} />
            </div>
            <span className="font-bold text-xl text-gray-800">Medicare</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome back</h1>
          <p className="text-gray-500 mb-8">Login to access your dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@medicare.com"
                />
              </div>
            </div>
            <div>
              <label className="label-field">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="bg-primary-50 rounded-xl p-4 mt-6 text-xs text-primary-700 leading-relaxed">
            <p className="font-semibold mb-1">Demo credentials (after seeding):</p>
            <p>admin@medicare.com / admin123</p>
            <p>doctor@medicare.com / doctor123</p>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary-600 font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
