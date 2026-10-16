import React from 'react';

const variants = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  purple: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function Badge({ children, variant = 'neutral', className = '', size = 'sm' }) {
  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.2 text-[10px]' : 'px-2.5 py-0.5 text-xs';
  const variantClass = variants[variant] || variants.neutral;

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${variantClass} ${className}`}>
      {children}
    </span>
  );
}
