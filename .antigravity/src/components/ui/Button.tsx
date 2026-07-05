import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-brand-green-900 hover:bg-brand-green-800 text-white focus:ring-brand-green-700 font-bold',
    secondary: 'bg-brand-cream-100 hover:bg-brand-cream-200 text-brand-green-950 border border-brand-cream-200/60 focus:ring-brand-cream-200 font-bold',
    outline: 'border border-slate-200 bg-white hover:bg-brand-cream-50 text-slate-700 focus:ring-brand-green-900 font-semibold',
    danger: 'bg-rose-700 hover:bg-rose-800 text-white focus:ring-rose-600 font-bold',
    success: 'bg-brand-green-700 hover:bg-brand-green-800 text-white focus:ring-brand-green-600 font-bold',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1 min-h-[44px] md:min-h-0',
    md: 'text-sm md:text-sm px-4 py-2 gap-2 min-h-[44px] md:min-h-0',
    lg: 'text-base px-5 py-2.5 gap-2.5 min-h-[48px] md:min-h-0',
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
