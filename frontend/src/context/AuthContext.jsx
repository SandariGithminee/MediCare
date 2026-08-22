import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes idle timeout
const WARNING_BEFORE_MS = 5 * 60 * 1000; // warn 5 minutes before

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const tokenExpiryTimerRef = useRef(null);

  const performLogout = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    clearTimeout(warningTimerRef.current);
    clearTimeout(tokenExpiryTimerRef.current);
    localStorage.removeItem("medicareUser");
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    performLogout();
    toast.success("Logged out successfully");
  }, [performLogout]);

  const resetIdleTimer = useCallback(() => {
    if (!user) return;
    clearTimeout(idleTimerRef.current);
    clearTimeout(warningTimerRef.current);

    warningTimerRef.current = setTimeout(() => {
      toast("Session expiring soon. Move mouse or press a key to stay logged in.", {
        icon: "⏳",
        duration: 10000,
      });
    }, SESSION_TIMEOUT_MS - WARNING_BEFORE_MS);

    idleTimerRef.current = setTimeout(() => {
      toast.error("Session expired due to inactivity");
      performLogout();
      window.location.href = "/login";
    }, SESSION_TIMEOUT_MS);
  }, [user, performLogout]);

  // Set up JWT token expiry timer
  const setupTokenExpiryTimer = useCallback((token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp) {
        const expiresIn = payload.exp * 1000 - Date.now();
        if (expiresIn <= 0) {
          performLogout();
          window.location.href = "/login";
          return;
        }
        clearTimeout(tokenExpiryTimerRef.current);
        tokenExpiryTimerRef.current = setTimeout(() => {
          toast.error("Your session token has expired. Please log in again.");
          performLogout();
          window.location.href = "/login";
        }, expiresIn);
      }
    } catch {
      // Invalid token format, ignore
    }
  }, [performLogout]);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("medicareUser");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      if (parsed.token) {
        setupTokenExpiryTimer(parsed.token);
      }
    }
    setLoading(false);
  }, [setupTokenExpiryTimer]);

  // Set up idle listeners when user is logged in
  useEffect(() => {
    if (!user) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    const handleActivity = () => resetIdleTimer();

    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    resetIdleTimer(); // start the timer

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearTimeout(idleTimerRef.current);
      clearTimeout(warningTimerRef.current);
    };
  }, [user, resetIdleTimer]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("medicareUser", JSON.stringify(data));
    setUser(data);
    if (data.token) setupTokenExpiryTimer(data.token);
    toast.success(`Welcome back, ${data.name}!`);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("medicareUser", JSON.stringify(data));
    setUser(data);
    if (data.token) setupTokenExpiryTimer(data.token);
    toast.success("Account created successfully!");
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
