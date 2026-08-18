import React from "react";

const styles = {
  Active: "bg-primary-100 text-primary-700",
  Admitted: "bg-amber-100 text-amber-700",
  Discharged: "bg-gray-100 text-gray-600",
  Pending: "bg-amber-100 text-amber-700",
  Confirmed: "bg-accent-100 text-accent-700",
  Completed: "bg-primary-100 text-primary-700",
  Cancelled: "bg-coral-100 text-coral-700",
  Paid: "bg-primary-100 text-primary-700",
  Partial: "bg-amber-100 text-amber-700",
  "On Leave": "bg-amber-100 text-amber-700",
  Inactive: "bg-gray-100 text-gray-600",
};

const Badge = ({ status }) => (
  <span className={`badge ${styles[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>
);

export default Badge;
