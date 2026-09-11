import React, { useState } from "react";
import { Link } from "react-router-dom";
import { HeartPulse, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
      toast.success("Reset link sent! Please check your email.");
    } catch (error) {
      toast.error(error.message || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block relative">
        <img
          src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=900&h=1200&fit=crop"
          alt="Hospital Laboratory"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-primary-700/30 to-transparent"></div>
        <div className="absolute bottom-10 left-10 text-white max-w-sm">
          <h2 className="text-2xl font-bold mb-2">Secure & Reliable.</h2>
          <p className="text-white/80 text-sm">
            Easily recover your account access and stay connected to patient care.
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

          {!submitted ? (
            <>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">Forgot password?</h1>
              <p className="text-gray-500 mb-8 text-sm">
                No worries! Enter your registered email address and we'll send you instructions to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label-field">Registered Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-10"
                      placeholder="doctor@medicare.com"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? "Sending reset link..." : "Send Reset Link"}
                </button>
              </form>
            </>
          ) : (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 text-center animate-fade-in">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Check your inbox</h2>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                We've sent a password recovery link to <span className="font-semibold text-gray-800">{email}</span>. Follow the link to choose a new password.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs text-primary-600 hover:underline font-medium block mx-auto mb-2"
              >
                Didn't get the email? Try again
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition font-medium"
            >
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
