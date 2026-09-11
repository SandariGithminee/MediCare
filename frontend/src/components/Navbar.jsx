import React, { useState } from "react";
import { Menu, Bell, LogOut, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Modal from "./Modal";
import api from "../api/axios";
import toast from "react-hot-toast";

const Navbar = ({ setSidebarOpen }) => {
  const { user, logout, changePassword } = useAuth();
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    if (pwForm.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    setPwLoading(true);
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword);
      toast.success("Password changed successfully!");
      setPwModalOpen(false);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.message || error.response?.data?.message || "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div>
            <h2 className="font-semibold text-gray-800">
              Welcome back, {user?.name?.split(" ")[0]} 👋
            </h2>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
            <Bell size={20} className="text-gray-500" />
            <span className="absolute top-1 right-1.5 w-2 h-2 bg-coral-500 rounded-full"></span>
          </button>
          <button
            onClick={() => setPwModalOpen(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            title="Change Password"
          >
            <KeyRound size={20} className="text-gray-500" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-semibold text-sm">
            {user?.name?.charAt(0)}
          </div>
          <button
            onClick={logout}
            className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-coral-600 transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Change Password Modal */}
      <Modal isOpen={pwModalOpen} onClose={() => setPwModalOpen(false)} title="Change Password">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="label-field">Current Password</label>
            <input
              type="password"
              required
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              className="input-field"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="label-field">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              className="input-field"
              placeholder="Enter new password (min 6 chars)"
            />
          </div>
          <div>
            <label className="label-field">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              className="input-field"
              placeholder="Re-enter new password"
            />
          </div>
          <button type="submit" disabled={pwLoading} className="btn-primary w-full">
            {pwLoading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </Modal>
    </>
  );
};

export default Navbar;
