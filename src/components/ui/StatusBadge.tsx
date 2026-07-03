import React from 'react';

interface StatusBadgeProps {
  label: string;
  colorClass: string; // e.g. "bg-emerald-50 text-emerald-700 border-emerald-200"
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, colorClass }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass} whitespace-nowrap` }>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {label}
    </span>
  );
};
