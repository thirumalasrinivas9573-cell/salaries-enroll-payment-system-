import React from 'react';
import {
  Calendar,
  Building2,
  Cpu,
  ChevronDown,
  User,
  CheckCircle2,
  AlertCircle,
  Menu,
  LogOut
} from 'lucide-react';
import NotificationDropdown from './common/NotificationDropdown';

export default function Header({
  company,
  currentMonth,
  currentYear,
  onChangePeriod,
  onShowCppModal,
  onToggleSidebar,
  user,
  onLogout,
  notifications = []
}) {
  const months = [
    { num: 1, name: 'January' },
    { num: 2, name: 'February' },
    { num: 3, name: 'March' },
    { num: 4, name: 'April' },
    { num: 5, name: 'May' },
    { num: 6, name: 'June' },
    { num: 7, name: 'July' },
    { num: 8, name: 'August' },
    { num: 9, name: 'September' },
    { num: 10, name: 'October' },
    { num: 11, name: 'November' },
    { num: 12, name: 'December' },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Toggle, Organization & Demo environment tag */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="font-semibold text-xs sm:text-sm text-slate-800 truncate max-w-[150px] sm:max-w-xs">
            {company?.name || 'Apex Industrial Technologies Pvt Ltd'}
          </span>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
          Demo Environment
        </span>
      </div>

      {/* Right: Period Selector, Notifications, C++ Engine pill, Profile */}
      <div className="flex items-center gap-3">
        {/* Current Payroll Period Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-sky-600" />
          <span className="text-slate-500 font-medium hidden sm:inline">Payroll Month:</span>
          <select
            value={currentMonth}
            onChange={(e) => onChangePeriod(parseInt(e.target.value), currentYear)}
            className="bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 focus:ring-0 cursor-pointer"
          >
            {months.map((m) => (
              <option key={m.num} value={m.num}>
                {m.name}
              </option>
            ))}
          </select>
          <span className="text-slate-300">/</span>
          <select
            value={currentYear}
            onChange={(e) => onChangePeriod(currentMonth, parseInt(e.target.value))}
            className="bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 focus:ring-0 cursor-pointer"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>

        {/* C++ Engine Inspection Trigger */}
        <button
          onClick={onShowCppModal}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-medium transition-colors"
          title="Inspect C++ OOP Core Architecture"
        >
          <Cpu className="w-3.5 h-3.5 text-sky-600" />
          <span>C++ Architecture</span>
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        </button>

        {/* Notifications Dropdown */}
        <NotificationDropdown notifications={notifications} />

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="hidden lg:block text-left leading-tight">
            <span className="block text-xs font-semibold text-slate-800">
              {user?.name || company?.signatory_name || 'Administrator'}
            </span>
            <span className="block text-[10px] text-slate-500 capitalize">
              {user?.role || 'System Admin'}
            </span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 ml-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
