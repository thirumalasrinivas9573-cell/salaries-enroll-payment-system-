import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Save,
  RotateCcw,
  Sparkles,
  Calculator,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Info,
  SlidersHorizontal,
  FileSpreadsheet
} from 'lucide-react';
import Badge from '../components/common/Badge';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { api } from '../services/api';

export default function AttendanceEntry({
  currentMonth = 10,
  currentYear = 2026,
  onChangePeriod,
  onProceedToPayroll
}) {
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [showAdvancedColumns, setShowAdvancedColumns] = useState(false);

  useEffect(() => {
    setMonth(currentMonth);
    setYear(currentYear);
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchAttendance();
  }, [month, year]);

  const fetchAttendance = async () => {
    setLoading(true);
    setFeedback({ text: '', type: '' });
    try {
      const res = await api.getAttendance(month, year);
      setRecords(res.data || []);
    } catch (err) {
      setFeedback({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, field, value) => {
    const updated = [...records];
    const num = parseFloat(value) || 0;
    updated[index][field] = num;

    // Recalculate NCP Days automatically
    const cal = updated[index].calendar_days || new Date(year, month, 0).getDate();
    const present = updated[index].present_days || 0;
    const leaves = updated[index].paid_leaves || 0;
    const off = updated[index].weekly_offs || 0;
    const paid = Math.min(cal, present + leaves + off);
    updated[index].ncp_days = Math.max(0, cal - paid);
    updated[index].absent_days = updated[index].ncp_days;

    setRecords(updated);
  };

  const handleTextChange = (index, field, value) => {
    const updated = [...records];
    updated[index][field] = value;
    setRecords(updated);
  };

  const handleAutoFillStandard = () => {
    const calDays = new Date(year, month, 0).getDate();
    const offDays = 4;
    const standardPresent = calDays - offDays; // e.g. 26 for 30-day month, 27 for 31-day month

    const updated = records.map((r) => ({
      ...r,
      calendar_days: calDays,
      present_days: standardPresent,
      paid_leaves: 0,
      weekly_offs: offDays,
      absent_days: 0,
      ncp_days: 0
    }));
    setRecords(updated);
    setFeedback({
      text: `Auto-populated standard working schedule for ${calDays}-day month: ${standardPresent} present + ${offDays} weekly offs for all employees.`,
      type: 'info'
    });
  };

  const handleSaveAll = async () => {
    // Client-side pre-validation
    const calDays = new Date(year, month, 0).getDate();
    for (const r of records) {
      const totalPaid = (r.present_days || 0) + (r.paid_leaves || 0) + (r.weekly_offs || 0);
      const totalCal = r.calendar_days || calDays;
      if (totalPaid > totalCal) {
        setFeedback({
          text: `Validation error for ${r.emp_code} (${r.full_name}): Total paid days (${totalPaid}) cannot exceed calendar days (${totalCal}).`,
          type: 'error'
        });
        return;
      }
      if (r.present_days < 0 || r.paid_leaves < 0 || r.weekly_offs < 0 || r.overtime_hours < 0 || r.advance_deduction < 0 || r.other_deductions < 0) {
        setFeedback({
          text: `Validation error for ${r.emp_code}: Negative values are prohibited.`,
          type: 'error'
        });
        return;
      }
    }

    setSaving(true);
    setFeedback({ text: '', type: '' });
    try {
      await api.saveAttendance(month, year, records);
      setFeedback({
        text: `Attendance and wage entries for ${month}/${year} validated and saved successfully!`,
        type: 'success'
      });
    } catch (err) {
      setFeedback({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const monthCalendarDays = new Date(year, month, 0).getDate();

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <CalendarCheck2 className="w-5 h-5 text-sky-600 shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Payroll Month:</span>
            <select
              value={month}
              onChange={(e) => {
                const newM = parseInt(e.target.value);
                setMonth(newM);
                if (onChangePeriod) onChangePeriod(newM, year);
              }}
              className="text-xs font-semibold text-slate-900"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <span className="text-slate-300">/</span>
            <select
              value={year}
              onChange={(e) => {
                const newY = parseInt(e.target.value);
                setYear(newY);
                if (onChangePeriod) onChangePeriod(month, newY);
              }}
              className="text-xs font-semibold text-slate-900"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
            <span className="text-[11px] text-slate-400 font-mono ml-1">
              ({monthCalendarDays} Calendar Days)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setShowAdvancedColumns(!showAdvancedColumns)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
              showAdvancedColumns
                ? 'bg-sky-50 border-sky-300 text-sky-800'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
            title="Toggle Wage Base and Detailed Deductions Columns"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {showAdvancedColumns ? 'Hide Statutory Bases' : 'Configured Wage Bases'}
          </button>

          <button
            onClick={handleAutoFillStandard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Standard Month Auto-Fill
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Validating & Saving...' : 'Save Attendance Sheet'}
          </button>

          {onProceedToPayroll && (
            <button
              onClick={() => onProceedToPayroll(month, year)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Calculator className="w-3.5 h-3.5" />
              Compute Payroll
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedback.text && (
        <div
          className={`p-3 rounded-md text-xs font-medium flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : feedback.type === 'info'
              ? 'bg-sky-50 text-sky-800 border border-sky-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Statutory Guidance */}
      <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-md text-xs text-slate-700 flex items-start gap-2">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>EPFO NCP Days & Different Wage Bases:</strong> Non-Contributing Period (NCP) days represent loss of pay / unauthorized leaves. In the official ECR file, NCP days reduce pension service credit. If your company specifies a custom PF wage base (e.g. ₹15,000 cap or basic only), enter it under "PF Wage Base"; otherwise the system automatically defaults to earned Basic + DA.
        </p>
      </div>

      {/* Attendance Spreadsheet Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-slate-600" />
              <CardTitle>Monthly Attendance & Wage Inputs Register</CardTitle>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Month: {month}/{year} • {records.length} Employees
            </div>
          </div>
          <CardDescription>
            Paid working days, NCP days, overtime hours/amounts, advance deductions, and distinct statutory wage bases.
          </CardDescription>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-2 text-center">Cal. Days</th>
                <th className="py-3 px-2 text-center">Present Days</th>
                <th className="py-3 px-2 text-center">Paid Leaves</th>
                <th className="py-3 px-2 text-center">Weekly Off</th>
                <th className="py-3 px-3 text-center bg-slate-100 font-bold text-slate-900">Paid Days</th>
                <th className="py-3 px-3 text-center bg-amber-50 text-amber-800 font-bold">NCP (Absent)</th>
                <th className="py-3 px-2 text-center">OT Hours</th>
                <th className="py-3 px-2 text-center">OT Pay (₹)</th>
                <th className="py-3 px-2 text-center">Advance (₹)</th>
                <th className="py-3 px-2 text-center">Other Ded. (₹)</th>
                {showAdvancedColumns && (
                  <>
                    <th className="py-3 px-2 text-center bg-indigo-50 text-indigo-900 font-bold">Config. PF Base</th>
                    <th className="py-3 px-2 text-center bg-amber-50 text-amber-900 font-bold">Config. ESIC Base</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={showAdvancedColumns ? 13 : 11} className="py-12 text-center text-slate-400">
                    Loading monthly attendance sheet...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={showAdvancedColumns ? 13 : 11} className="py-12 text-center text-slate-400">
                    No active employees registered. Please add employees in Employee Master.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => {
                  const cal = r.calendar_days || monthCalendarDays;
                  const totalPaid = (r.present_days || 0) + (r.paid_leaves || 0) + (r.weekly_offs || 0);
                  const isExceeded = totalPaid > cal;
                  const hasNegative = (r.present_days < 0 || r.paid_leaves < 0 || r.weekly_offs < 0 || r.overtime_hours < 0 || r.advance_deduction < 0 || r.other_deductions < 0);

                  return (
                    <tr
                      key={r.employee_id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isExceeded || hasNegative ? 'bg-rose-50/50' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-sans">
                        <div className="font-semibold text-slate-900">{r.full_name}</div>
                        <div className="text-slate-500 font-mono text-[10px]">
                          {r.emp_code} • {r.department}
                        </div>
                        {isExceeded && (
                          <span className="text-[9px] text-rose-600 font-semibold block">
                            Paid days exceed cal. days ({totalPaid}/{cal})!
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          value={r.calendar_days || monthCalendarDays}
                          onChange={(e) => handleChange(idx, 'calendar_days', e.target.value)}
                          className="w-14 text-center font-mono"
                          min="28"
                          max="31"
                        />
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={r.present_days}
                          onChange={(e) => handleChange(idx, 'present_days', e.target.value)}
                          className={`w-16 text-center font-mono font-semibold ${
                            r.present_days < 0 ? 'border-rose-500 text-rose-600' : 'text-slate-900'
                          }`}
                        />
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={r.paid_leaves}
                          onChange={(e) => handleChange(idx, 'paid_leaves', e.target.value)}
                          className="w-14 text-center font-mono"
                        />
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={r.weekly_offs}
                          onChange={(e) => handleChange(idx, 'weekly_offs', e.target.value)}
                          className="w-14 text-center font-mono"
                        />
                      </td>

                      <td
                        className={`py-2.5 px-3 text-center font-bold font-mono text-sm ${
                          isExceeded ? 'text-rose-600 bg-rose-100' : 'text-slate-900 bg-slate-50'
                        }`}
                      >
                        {totalPaid}
                      </td>

                      <td className="py-2.5 px-3 text-center bg-amber-50/50 font-bold text-amber-700 font-mono text-sm">
                        {r.ncp_days || 0}
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={r.overtime_hours}
                          onChange={(e) => handleChange(idx, 'overtime_hours', e.target.value)}
                          className="w-14 text-center font-mono"
                          title="Overtime hours worked"
                        />
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          placeholder="Auto"
                          value={r.overtime_amount || ''}
                          onChange={(e) => handleChange(idx, 'overtime_amount', e.target.value)}
                          className="w-16 text-center font-mono text-[11px]"
                          title="Leave blank to calculate from OT hours at double rate, or enter fixed OT payout"
                        />
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={r.advance_deduction || ''}
                          placeholder="0"
                          onChange={(e) => handleChange(idx, 'advance_deduction', e.target.value)}
                          className="w-16 text-center font-mono text-rose-700 text-[11px]"
                          title="Advance repayment to deduct from net salary"
                        />
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={r.other_deductions || ''}
                          placeholder="0"
                          onChange={(e) => handleChange(idx, 'other_deductions', e.target.value)}
                          className="w-16 text-center font-mono text-slate-700 text-[11px]"
                          title="Other authorized deductions (canteen, loan, etc.)"
                        />
                      </td>

                      {showAdvancedColumns && (
                        <>
                          <td className="py-2.5 px-2 text-center bg-indigo-50/30">
                            <input
                              type="number"
                              min="0"
                              placeholder="Auto Basic+DA"
                              value={r.pf_wage_base || ''}
                              onChange={(e) => handleChange(idx, 'pf_wage_base', e.target.value)}
                              className="w-24 text-center font-mono text-indigo-700 text-[11px]"
                              title="Configured PF wage base override if different from Basic+DA"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center bg-amber-50/30">
                            <input
                              type="number"
                              min="0"
                              placeholder="Auto Gross"
                              value={r.esic_wage_base || ''}
                              onChange={(e) => handleChange(idx, 'esic_wage_base', e.target.value)}
                              className="w-24 text-center font-mono text-amber-700 text-[11px]"
                              title="Configured ESIC wage base override if different from total earned gross"
                            />
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
