const jwt = require("jsonwebtoken");
const db = require("../config/db");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { rows } = await db.query(
        "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
        [decoded.id]
      );

      if (!rows.length) {
        return res.status(401).json({ message: "User not found" });
      }

      const u = rows[0];
      req.user = {
        _id: u.id,
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
      };
      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = (req.user.role || "").toLowerCase();
    const allowed = roles.map((r) => r.toLowerCase());
    if (!allowed.includes(userRole)) {
      return res.status(403).json({ message: `Role '${req.user.role}' is not authorized for this action` });
    }
    next();
  };
};

module.exports = { protect, authorize };
