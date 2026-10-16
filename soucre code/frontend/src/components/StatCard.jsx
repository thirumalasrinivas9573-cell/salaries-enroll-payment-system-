import React from 'react';

export default function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'sky',
  highlight
}) {
  const iconColors = {
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  const iconClass = iconColors[color] || iconColors.sky;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        {Icon && (
          <div className={`w-8 h-8 rounded-md border flex items-center justify-center shrink-0 ${iconClass}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-2.5">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        {subtext && (
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            {highlight && <span className="text-sky-700 font-semibold">{highlight}</span>}
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
