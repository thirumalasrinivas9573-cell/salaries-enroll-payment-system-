import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

export default function NotificationDropdown({ notifications = [] }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const count = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        title="Validation Warnings & Notifications"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                System & Statutory Alerts
              </span>
              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold">
                {count}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                All employee records, statutory ceilings, and UAN/ESIC numbers are validated.
              </div>
            ) : (
              notifications.map((n, idx) => (
                <div key={idx} className="p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3">
                  {n.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  ) : n.type === 'error' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{n.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.message}</div>
                    {n.time && <div className="text-[10px] text-slate-400 mt-1 font-mono">{n.time}</div>}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
            <span className="text-[11px] text-slate-500 font-medium">
              Statutory Compliance Rules Engine v1.0
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
