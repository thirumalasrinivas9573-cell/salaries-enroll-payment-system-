import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  Calculator,
  ShieldCheck,
  HeartPulse,
  History,
  FileSpreadsheet,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Cpu
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'attendance', label: 'Attendance & Wages', icon: CalendarCheck2 },
  { id: 'payroll-process', label: 'Payroll Processing', icon: Calculator, badge: 'C++' },
  { id: 'pf-ledger', label: 'PF Management', icon: ShieldCheck },
  { id: 'esic-ledger', label: 'ESIC Management', icon: HeartPulse },
  { id: 'history', label: 'Payroll History', icon: History },
  { id: 'reports', label: 'Reports & Exports', icon: FileSpreadsheet },
  { id: 'settings', label: 'Settings', icon: Sliders },
];

export default function Sidebar({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  engineReady
}) {
  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-200 z-30 select-none ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
              ₹
            </div>
            <div className="leading-none truncate">
              <span className="font-bold text-sm text-slate-900 tracking-tight block">
                Salary Enroll
              </span>
              <span className="text-[10px] text-sky-700 font-medium tracking-wide">
                PF & ESIC Enterprise
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
            ₹
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ${
            collapsed ? 'hidden' : 'block'
          }`}
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* C++ OOP Engine Status Pill */}
      <div className={`px-3 py-2 border-b border-slate-100 bg-slate-50/70 ${collapsed ? 'text-center' : ''}`}>
        {!collapsed ? (
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-sky-600" />
              C++17 Engine
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              engineReady
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {engineReady ? 'LINKED' : 'READY'}
            </span>
          </div>
        ) : (
          <div
            className="w-2.5 h-2.5 mx-auto rounded-full bg-emerald-500"
            title="C++17 Engine Linked"
          ></div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-md text-xs font-medium transition-all duration-150 ${
                collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-100 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-sky-600' : 'text-slate-400'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && item.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                  isActive
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Toggle Expand for Collapsed View */}
      {collapsed && (
        <div className="p-2 border-t border-slate-100 text-center">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 mx-auto block"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer Branding */}
      {!collapsed && (
        <div className="p-3.5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500">
          <p className="font-semibold text-slate-700">Enterprise Payroll v1.0</p>
          <p className="text-[10px] text-slate-400">EPFO & ESIC 2026 Compliant</p>
        </div>
      )}
    </aside>
  );
}
