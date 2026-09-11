const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { supabase } = require("../config/supabase");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Please provide name, email, and password" });
    }

    if (role && role.trim().toLowerCase() === "admin") {
      return res.status(400).json({ message: "Admin accounts cannot be self-registered. Please contact an administrator." });
    }

    const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    let authId = null;
    let accessToken = null;

    // 1. Try Supabase signUp first
    try {
      const { data: sbData, error: sbError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role: role || "receptionist" },
        },
      });

      if (!sbError && sbData?.user) {
        authId = sbData.user.id;
        if (sbData.session) {
          accessToken = sbData.session.access_token;
        }
      }
    } catch (sbErr) {
      // Fall through to database creation
    }

    // 2. If Supabase signUp was rate-limited or restricted, create directly in auth.users
    if (!authId) {
      const userIdRes = await db.query("SELECT gen_random_uuid() as uid");
      authId = userIdRes.rows[0].uid;
      const encPw = await db.query("SELECT crypt($1, gen_salt('bf')) as pw", [password]);
      const hashedPw = encPw.rows[0].pw;

      await db.query(
        `INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password,
          email_confirmed_at, confirmation_token, recovery_token,
          email_change_token_new, email_change_token_current,
          phone_change_token, reauthentication_token, email_change, phone,
          raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          $1, 'authenticated', 'authenticated', $2, $3,
          NOW(), '', '', '', '', '', '', '', NULL,
          '{"provider":"email","providers":["email"]}'::jsonb,
          json_build_object('name', $4::text, 'role', $5::text)::jsonb,
          NOW(), NOW()
        )`,
        [authId, email, hashedPw, name, role || "receptionist"]
      );

      await db.query(
        `INSERT INTO auth.identities (
          id, user_id, identity_data, provider, provider_id,
          last_sign_in_at, created_at, updated_at
        ) VALUES (
          $1::uuid, $1::uuid, json_build_object('sub', $1::uuid, 'email', $2::text)::jsonb,
          'email', $1::text, NOW(), NOW(), NOW()
        )`,
        [authId, email]
      );
    }

    // 3. Ensure user exists in public.users
    const salt = await bcrypt.genSalt(10);
    const localHashedPassword = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO users (auth_id, name, email, password, role, status, is_approved)
       VALUES ($1, $2, $3, $4, $5, 'Pending', FALSE)
       ON CONFLICT (email) DO UPDATE
       SET auth_id = EXCLUDED.auth_id, name = EXCLUDED.name, role = EXCLUDED.role, status = 'Pending', is_approved = FALSE
       RETURNING id, auth_id, name, email, role, status, is_approved`,
      [authId, name, email, localHashedPassword, role || "receptionist"]
    );

    const user = result.rows[0];

    res.status(201).json({
      _id: user.id,
      id: user.id,
      auth_id: user.auth_id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isApproved: user.is_approved,
      requiresApproval: true,
      message: "Registration submitted successfully! Your account is pending administrator approval before you can log in.",
    });
  } catch (error) {
    console.error("registerUser Error:", error);
    res.status(500).json({ message: error.message || "Failed to register user" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Check approval status for non-admin accounts
    const userRole = (user.role || "").toLowerCase();
    if (userRole !== "admin") {
      if (user.status === "Pending" || user.is_approved === false) {
        return res.status(403).json({
          message: "Your registration is pending administrator approval. You will be able to log in once an administrator approves your account.",
          isPendingApproval: true,
        });
      }
      if (user.status === "Rejected") {
        return res.status(403).json({
          message: "Your registration was not approved by the administrator. Please contact hospital administration.",
          isRejected: true,
        });
      }
    }

    // If password is not stored in public.users, attempt Supabase Auth login
    if (!user.password && user.auth_id) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return res.status(401).json({ message: error.message });
      }
      return res.json({
        _id: user.id,
        id: user.id,
        auth_id: user.auth_id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || "Approved",
        token: data.session.access_token,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      res.json({
        _id: user.id,
        id: user.id,
        auth_id: user.auth_id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || "Approved",
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  res.json(req.user);
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const result = await db.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    // Verify current password: check bcrypt if in public.users, or check against Supabase
    let isValid = false;
    if (user.password) {
      isValid = await bcrypt.compare(currentPassword, user.password);
    } else if (user.auth_id) {
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      isValid = !verifyErr;
    }

    if (!isValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update public.users
    await db.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, req.user.id]);

    // Also sync to auth.users if auth_id exists
    if (user.auth_id) {
      await db.query(
        "UPDATE auth.users SET encrypted_password = crypt($1, gen_salt('bf')), updated_at = NOW() WHERE id = $2",
        [newPassword, user.auth_id]
      );
    }

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin registration approval controllers
const getRegistrations = async (req, res) => {
  try {
    const { status } = req.query;
    let queryText = "SELECT id, auth_id, name, email, role, status, is_approved, created_at FROM users";
    let params = [];

    if (status && status !== "All") {
      queryText += " WHERE status ILIKE $1";
      params.push(status);
    }

    queryText += " ORDER BY created_at DESC";

    const { rows } = await db.query(queryText, params);
    res.json(
      rows.map((u) => ({
        _id: u.id,
        id: u.id,
        auth_id: u.auth_id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status || (u.is_approved ? "Approved" : "Pending"),
        isApproved: u.is_approved,
        createdAt: u.created_at,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch registrations" });
  }
};

const approveRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      "UPDATE users SET status = 'Approved', is_approved = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, name, email, role, status, is_approved",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: `Registration for ${rows[0].name} (${rows[0].email}) approved successfully!`,
      user: rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to approve registration" });
  }
};

const rejectRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      "UPDATE users SET status = 'Rejected', is_approved = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, name, email, role, status, is_approved",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: `Registration for ${rows[0].name} (${rows[0].email}) has been rejected.`,
      user: rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to reject registration" });
  }
};

const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query("DELETE FROM users WHERE id = $1 RETURNING id, name, email", [id]);

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User registration removed." });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete registration" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  changePassword,
  getRegistrations,
  approveRegistration,
  rejectRegistration,
  deleteRegistration,
};
