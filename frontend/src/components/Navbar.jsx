import React from "react";
import { Menu, Bell, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth();

  return (
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
  );
};

export default Navbar;
