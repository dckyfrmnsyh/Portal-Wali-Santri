import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  id: string;
}

export const Input: React.FC<InputProps> = ({ label, error, id, className = '', ...props }) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`block w-full px-4 py-3 md:py-2 text-sm text-slate-800 placeholder-slate-400 bg-white border rounded-lg focus:outline-none focus:ring-1 transition-colors min-h-[44px] ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
            : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};
