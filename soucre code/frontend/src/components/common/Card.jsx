import React from 'react';

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', action }) {
  return (
    <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${className}`}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base font-semibold text-slate-900 tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-xs text-slate-500 mt-0.5 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-3 bg-slate-50 border-t border-slate-100 rounded-b-lg flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}
