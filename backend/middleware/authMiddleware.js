const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { supabase } = require("../config/supabase");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // 1. Try verifying via Supabase Auth
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser(token);
        if (!authError && authData?.user) {
          const authUser = authData.user;
          const { rows } = await db.query(
            "SELECT id, auth_id, name, email, role, status, is_approved, created_at FROM users WHERE auth_id = $1 OR email = $2",
            [authUser.id, authUser.email]
          );

          if (rows.length > 0) {
            const u = rows[0];
            if (!u.auth_id) {
              await db.query("UPDATE users SET auth_id = $1 WHERE id = $2", [authUser.id, u.id]);
            }

            const userRole = (u.role || authUser.user_metadata?.role || "Staff").toLowerCase();
            const isApproved = u.is_approved !== false && u.status !== "Pending" && u.status !== "Rejected";

            if (userRole !== "admin" && !isApproved) {
              return res.status(403).json({
                message: "Your registration is pending administrator approval. Please wait for an administrator to approve your account.",
                isPendingApproval: true,
              });
            }

            req.user = {
              _id: u.id,
              id: u.id,
              auth_id: authUser.id,
              name: u.name || authUser.user_metadata?.name || authUser.email.split("@")[0],
              email: u.email,
              role: u.role || authUser.user_metadata?.role || "Staff",
              status: u.status || "Approved",
              isApproved: u.is_approved,
            };
            return next();
          } else {
            // User exists in auth.users but not in public.users yet; create user in public.users
            const role = authUser.user_metadata?.role || "Receptionist";
            const name = authUser.user_metadata?.name || authUser.email.split("@")[0];
            const insertResult = await db.query(
              "INSERT INTO users (auth_id, name, email, role, status, is_approved) VALUES ($1, $2, $3, $4, 'Pending', FALSE) RETURNING id, auth_id, name, email, role, status, is_approved",
              [authUser.id, name, authUser.email, role]
            );
            const newUser = insertResult.rows[0];

            if (role.toLowerCase() !== "admin") {
              return res.status(403).json({
                message: "Your registration is pending administrator approval. Please wait for an administrator to approve your account.",
                isPendingApproval: true,
              });
            }

            req.user = {
              _id: newUser.id,
              id: newUser.id,
              auth_id: authUser.id,
              name: newUser.name,
              email: newUser.email,
              role: newUser.role,
              status: newUser.status,
              isApproved: newUser.is_approved,
            };
            return next();
          }
        }
      } catch (sbErr) {
        // Fall through to legacy JWT check
      }

      // 2. Fallback to legacy JWT verification for backward compatibility
      if (process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const { rows } = await db.query(
            "SELECT id, auth_id, name, email, role, status, is_approved, created_at FROM users WHERE id = $1",
            [decoded.id]
          );

          if (rows.length > 0) {
            const u = rows[0];
            const userRole = (u.role || "Staff").toLowerCase();
            const isApproved = u.is_approved !== false && u.status !== "Pending" && u.status !== "Rejected";

            if (userRole !== "admin" && !isApproved) {
              return res.status(403).json({
                message: "Your registration is pending administrator approval. Please wait for an administrator to approve your account.",
                isPendingApproval: true,
              });
            }

            req.user = {
              _id: u.id,
              id: u.id,
              auth_id: u.auth_id,
              name: u.name,
              email: u.email,
              role: u.role,
              status: u.status || "Approved",
              isApproved: u.is_approved,
            };
            return next();
          }
        } catch (jwtErr) {
          // Token verification failed on both
        }
      }

      return res.status(401).json({ message: "Not authorized, token failed" });
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = (req.user?.role || "").toLowerCase();
    const allowed = roles.map((r) => r.toLowerCase());
    if (!allowed.includes(userRole)) {
      return res.status(403).json({ message: `Role '${req.user?.role}' is not authorized for this action` });
    }
    next();
  };
};

module.exports = { protect, authorize };
