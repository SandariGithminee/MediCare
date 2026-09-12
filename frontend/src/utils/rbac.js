/**
 * Role-Based Access Control (RBAC) configuration for Medicare HMS
 */

export const MODULE_PERMISSIONS = {
  "/dashboard": ["admin"],
  "/dashboard?tab=approvals": ["admin"],
  "/patients": ["admin", "doctor", "nurse", "receptionist", "accountant", "cashier", "hr"],
  "/doctors": ["admin", "doctor", "nurse", "receptionist", "accountant", "cashier", "hr"],
  "/appointments": ["admin", "doctor", "nurse", "receptionist"],
  "/emr": ["admin", "doctor", "nurse"],
  "/laboratory": ["admin", "doctor", "lab"],
  "/pharmacy": ["admin", "doctor", "pharmacist"],
  "/admissions": ["admin", "doctor", "nurse", "receptionist"],
  "/staff": ["admin", "hr"],
  "/billing": ["admin", "accountant", "receptionist", "cashier"],
  "/reports": ["admin", "accountant", "cashier", "hr"],
  "/audit-logs": ["admin"],
};

/**
 * Get the default landing route for a specific user role.
 * @param {string} role 
 * @returns {string} Path to redirect user to
 */
export const getDefaultRouteForRole = (role) => {
  const r = (role || "").toLowerCase().trim();
  switch (r) {
    case "admin":
      return "/dashboard";
    case "doctor":
      return "/appointments";
    case "nurse":
      return "/patients";
    case "receptionist":
      return "/appointments";
    case "pharmacist":
      return "/pharmacy";
    case "lab":
      return "/laboratory";
    case "accountant":
    case "cashier":
      return "/billing";
    case "hr":
      return "/staff";
    default:
      return "/patients";
  }
};

/**
 * Checks if a specific route path is allowed for a user role.
 * @param {string} path - URL path (e.g. '/patients')
 * @param {string} role - User role (e.g. 'doctor')
 * @returns {boolean}
 */
export const isRouteAllowed = (path, role) => {
  const r = (role || "").toLowerCase().trim();
  if (r === "admin") return true;

  // Clean path by stripping query params if needed
  const cleanPath = path.split("?")[0];
  const allowed = MODULE_PERMISSIONS[cleanPath] || MODULE_PERMISSIONS[path];

  if (!allowed) return false;
  return allowed.map((x) => x.toLowerCase()).includes(r);
};
