import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    type: 'up' | 'down' | 'neutral';
  };
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
  description?: string;
  id?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'indigo',
  description,
  id,
}) => {
  const bgColors = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  };

  return (
    <div id={id} className="bg-white p-4 md:p-6 rounded-xl border border-slate-100 shadow-xs flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800 mt-2 tracking-tight">{value}</h4>
        
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                trend.type === 'up'
                  ? 'bg-emerald-50 text-emerald-700'
                  : trend.type === 'down'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-slate-50 text-slate-700'
              }`}
            >
              {trend.type === 'up' ? '↑' : trend.type === 'down' ? '↓' : ''} {trend.value}
            </span>
            {description && <span className="text-xs text-slate-400 truncate">{description}</span>}
          </div>
        )}
        {!trend && description && (
          <p className="text-xs text-slate-400 mt-2 truncate">{description}</p>
        )}
      </div>
      
      {icon && (
        <div className={`p-3 rounded-xl border ${bgColors[color]} shrink-0`}>
          {icon}
        </div>
      )}
    </div>
  );
};
