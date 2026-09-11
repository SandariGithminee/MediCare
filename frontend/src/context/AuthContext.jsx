import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../api/supabase";
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

  // Sync Supabase session to state & localStorage
  const syncSession = useCallback(async (session) => {
    if (!session?.user) {
      setUser(null);
      localStorage.removeItem("medicareUser");
      return;
    }

    const { user: authUser, access_token } = session;
    const metadata = authUser.user_metadata || {};

    let name = metadata.name || authUser.email?.split("@")[0] || "User";
    let role = metadata.role || "Receptionist";
    let id = authUser.id;

    const userObj = {
      _id: id,
      id,
      auth_id: id,
      email: authUser.email,
      name,
      role,
      token: access_token,
    };

    setUser(userObj);
    localStorage.setItem("medicareUser", JSON.stringify(userObj));

    // Try fetching database profile to keep role/id accurately synced with Postgres
    try {
      const { data: profile } = await api.get("/auth/profile", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (profile) {
        const enriched = {
          ...userObj,
          id: profile.id || userObj.id,
          name: profile.name || userObj.name,
          role: profile.role || userObj.role,
        };
        setUser(enriched);
        localStorage.setItem("medicareUser", JSON.stringify(enriched));
      }
    } catch {
      // Offline or backend start delay, fallback to userObj
    }
  }, []);

  const performLogout = useCallback(async () => {
    clearTimeout(idleTimerRef.current);
    clearTimeout(warningTimerRef.current);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Supabase signOut error:", err);
    }
    localStorage.removeItem("medicareUser");
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    await performLogout();
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

  // Listen to Supabase Auth state changes
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session) {
          await syncSession(session);
        } else if (mounted) {
          // Check if cached user exists
          const cached = localStorage.getItem("medicareUser");
          if (cached) {
            try {
              setUser(JSON.parse(cached));
            } catch {}
          }
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session) {
        await syncSession(session);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        localStorage.removeItem("medicareUser");
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [syncSession]);

  // Idle listeners
  useEffect(() => {
    if (!user) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    const handleActivity = () => resetIdleTimer();

    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    resetIdleTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearTimeout(idleTimerRef.current);
      clearTimeout(warningTimerRef.current);
    };
  }, [user, resetIdleTimer]);

  const login = async (email, password) => {
    let authResult;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message?.toLowerCase().includes("email not confirmed")) {
          const customErr = new Error("Your account is not activated. Please check your email inbox to confirm your account.");
          customErr.isUnconfirmed = true;
          customErr.email = email;
          throw customErr;
        }
        throw error;
      }
      authResult = data;
    } catch (sbError) {
      if (sbError.isUnconfirmed) throw sbError;
      // If Supabase sign in failed or rejected, check with backend login endpoint
      try {
        const { data: bRes } = await api.post("/auth/login", { email, password });
        if (bRes) {
          const userObj = {
            _id: bRes.id,
            id: bRes.id,
            auth_id: bRes.auth_id,
            name: bRes.name,
            email: bRes.email,
            role: bRes.role,
            status: bRes.status,
            token: bRes.token,
          };
          setUser(userObj);
          localStorage.setItem("medicareUser", JSON.stringify(userObj));
          toast.success(`Welcome back, ${bRes.name}!`);
          return bRes;
        }
      } catch (bErr) {
        const msg = bErr.response?.data?.message || sbError.message;
        const err = new Error(msg);
        err.isPendingApproval = bErr.response?.data?.isPendingApproval;
        throw err;
      }
      throw sbError;
    }

    // Supabase auth succeeded - verify approval status in database profile before allowing session
    if (authResult?.session) {
      try {
        const { data: profile } = await api.get("/auth/profile", {
          headers: { Authorization: `Bearer ${authResult.session.access_token}` },
        });

        if (profile) {
          const role = (profile.role || "").toLowerCase();
          const isApproved = profile.is_approved !== false && profile.status !== "Pending" && profile.status !== "Rejected";

          if (role !== "admin" && !isApproved) {
            await supabase.auth.signOut();
            localStorage.removeItem("medicareUser");
            setUser(null);
            const approvalErr = new Error(
              profile.status === "Rejected"
                ? "Your registration request was rejected by the administrator. Please contact hospital administration."
                : "Your account is pending administrator approval. Please wait for an administrator to approve your registration before logging in."
            );
            approvalErr.isPendingApproval = true;
            throw approvalErr;
          }
        }
      } catch (profErr) {
        if (profErr.isPendingApproval || profErr.message?.includes("approval")) {
          await supabase.auth.signOut();
          localStorage.removeItem("medicareUser");
          setUser(null);
          throw profErr;
        }
      }

      await syncSession(authResult.session);
      toast.success(`Welcome back, ${authResult.user.user_metadata?.name || authResult.user.email}!`);
    }
    return authResult;
  };

  const register = async (payload) => {
    // Register through backend to ensure proper approval status and PostgreSQL record creation
    const { data: res } = await api.post("/auth/register", payload);

    // Sign out of any passive Supabase session to prevent auto-login before admin approval
    try {
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem("medicareUser");
    setUser(null);

    return { requiresApproval: true, ...res };
  };

  const forgotPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  };

  const resetPassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (user?.email) {
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (verifyErr) {
        throw new Error("Current password is incorrect");
      }
    }
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;

    try {
      await api.put("/auth/change-password", { currentPassword, newPassword });
    } catch {}

    return data;
  };

  const resendActivation = async (email) => {
    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        changePassword,
        resendActivation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
