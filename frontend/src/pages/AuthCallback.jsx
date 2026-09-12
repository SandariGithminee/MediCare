import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "../api/supabase";
import { getDefaultRouteForRole } from "../utils/rbac";
import toast from "react-hot-toast";

const AuthCallback = () => {
  const [status, setStatus] = useState("verifying"); // 'verifying', 'success', 'error'
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const getTargetRoute = (userSession) => {
    const cachedUser = JSON.parse(localStorage.getItem("medicareUser") || "{}");
    const role = userSession?.user?.user_metadata?.role || cachedUser?.role;
    return getDefaultRouteForRole(role);
  };

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        // Supabase client auto-parses URL hash or query code
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setStatus("error");
          setErrorMsg(error.message);
          return;
        }

        if (session) {
          setStatus("success");
          toast.success("Account activated successfully!");
          setTimeout(() => {
            navigate(getTargetRoute(session));
          }, 1500);
        } else {
          // Listen briefly for the auth event if token exchange is still in flight
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            if (newSession) {
              setStatus("success");
              toast.success("Account activated successfully!");
              setTimeout(() => {
                navigate(getTargetRoute(newSession));
              }, 1500);
            }
          });

          // Timeout fallback
          setTimeout(() => {
            setStatus((prev) => (prev === "verifying" ? "success" : prev));
            navigate("/login");
          }, 3000);

          return () => subscription?.unsubscribe();
        }
      } catch (err) {
        setStatus("error");
        setErrorMsg(err.message || "Activation link is invalid or expired.");
      }
    }

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center mx-auto mb-6">
          <HeartPulse className="text-white" size={24} />
        </div>

        {status === "verifying" && (
          <div>
            <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Activating your account...</h2>
            <p className="text-sm text-gray-500">Please wait while we verify your email address.</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Account Activated!</h2>
            <p className="text-sm text-gray-600 mb-6">Your email has been confirmed. Redirecting to your hospital portal...</p>
            <button
              onClick={() => navigate(getTargetRoute())}
              className="btn-primary w-full"
            >
              Continue to Portal
            </button>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="w-12 h-12 bg-coral-50 text-coral-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Activation Failed</h2>
            <p className="text-sm text-gray-600 mb-6">{errorMsg || "The link may be expired or already used."}</p>
            <button
              onClick={() => navigate("/login")}
              className="btn-primary w-full"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
