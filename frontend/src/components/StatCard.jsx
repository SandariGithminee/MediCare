import React from "react";

const colorMap = {
  primary: "from-primary-400 to-primary-600",
  accent: "from-accent-400 to-accent-600",
  coral: "from-coral-400 to-coral-600",
  amber: "from-amber-400 to-orange-500",
};

const StatCard = ({ icon: Icon, label, value, color = "primary", suffix = "" }) => {
  return (
    <div className="card hover:-translate-y-1 transition-transform duration-200 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{label}</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">
            {value}
            <span className="text-sm text-gray-400 ml-1">{suffix}</span>
          </h3>
        </div>
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-soft`}>
          <Icon className="text-white" size={22} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
