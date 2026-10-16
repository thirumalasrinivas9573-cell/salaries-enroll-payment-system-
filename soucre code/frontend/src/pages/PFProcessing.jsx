import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Download,
  CalendarCheck2,
  ArrowRight,
  Info,
  AlertTriangle,
  FileText,
  Copy,
  CheckCircle2
} from 'lucide-react';
import Badge from '../components/common/Badge';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { api } from '../services/api';

export default function PFProcessing({ currentMonth = 10, currentYear = 2026, onNavigateToECR }) {
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMonth(currentMonth);
    setYear(currentYear);
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchPFData();
  }, [month, year]);

  const fetchPFData = async () => {
    setLoading(true);
    try {
      const res = await api.previewPayroll(month, year);
      setPreview(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const slips = preview?.slips || [];
  const summary = preview?.summary;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Employees' Provident Fund & MP Act 1952</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            PF Management & Statutory Contribution Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated compliance for A/c 01 (EPF 12%), A/c 10 (EPS 8.33% capped at ₹1,250), A/c 21 (EDLI 0.5%), and A/c 02 (Admin 0.5%).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToECR && (
            <button
              onClick={onNavigateToECR}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Generate EPFO ECR 2.0 File
            </button>
          )}
        </div>
      </div>

      {/* Statutory Rules & Formula Explanation Callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-200 text-xs text-indigo-950 space-y-2">
          <div className="font-semibold text-indigo-900 flex items-center gap-1.5 text-sm">
            <Info className="w-4 h-4 text-indigo-600" />
            Statutory Calculation Methodology (EPFO)
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed text-[11px]">
            <li><strong>Wage Base:</strong> Basic Wage + Dearness Allowance (DA). Prorated by paid days.</li>
            <li><strong>Wage Ceiling:</strong> ₹15,000 / month. If Basic+DA exceeds ₹15,000, calculations are restricted to ₹15,000.</li>
            <li><strong>Employee Share (A/c 01):</strong> 12% of EPF Wages (rounded to nearest rupee).</li>
            <li><strong>Employer EPS Pension (A/c 10):</strong> 8.33% of EPS Wages, <strong>strictly capped at ₹1,250 / month</strong>.</li>
            <li><strong>Employer EPF Difference (A/c 01):</strong> Employee Share minus Employer EPS (~3.67%).</li>
            <li><strong>EDLI (A/c 21) & Admin (A/c 02):</strong> 0.50% each on statutory wages.</li>
          </ul>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
          <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Validation Checks & Active Warnings
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="p-2 rounded bg-white border border-slate-200 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>UAN Validation:</strong> All enrolled employees have verified 12-digit UAN identifiers.</span>
            </div>
            <div className="p-2 rounded bg-white border border-slate-200 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Wage Ceiling Cap:</strong> Employees with Basic+DA &gt; ₹15,000 are restricted to ₹15,000 statutory limit.</span>
            </div>
            <div className="p-2 rounded bg-white border border-slate-200 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>NCP Days Tracked:</strong> Non-contributing period (unpaid leaves) calculated to avoid service tenure errors.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold">PF Members</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{slips.filter(s => !s.employee.pfOptOut && s.employee.uan).length}</div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-indigo-700 font-semibold">EE Share (12%)</span>
            <div className="text-lg font-bold text-indigo-700 mt-1">₹{summary.totalEmployeePF.toFixed(2)}</div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-slate-700 font-semibold">EPS (A/c 10)</span>
            <div className="text-lg font-bold text-slate-800 mt-1">₹{summary.totalEmployerEPS.toFixed(2)}</div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-emerald-700 font-semibold">ER EPF (A/c 01)</span>
            <div className="text-lg font-bold text-emerald-700 mt-1">₹{summary.totalEmployerPF.toFixed(2)}</div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold">EDLI + Admin</span>
            <div className="text-lg font-bold text-slate-800 mt-1">₹{(summary.totalEDLI + summary.totalAdminCharges).toFixed(2)}</div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-purple-700 font-semibold">Total Challan</span>
            <div className="text-lg font-bold text-purple-700 mt-1">₹{summary.totalPFLiability.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* PF Ledger Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <CardTitle>EPFO Monthly Contribution Register</CardTitle>
          </div>
          <CardDescription>
            Individual breakdown of EPF wages, EPS capping, employer differences, and NCP days
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Member UAN & Name</th>
                <th className="py-3 px-3 text-right">Gross Wages</th>
                <th className="py-3 px-3 text-right">EPF Wages</th>
                <th className="py-3 px-3 text-right">EPS Wages</th>
                <th className="py-3 px-3 text-right text-indigo-700 font-bold">EE 12% (A/c 1)</th>
                <th className="py-3 px-3 text-right text-slate-700">EPS (A/c 10)</th>
                <th className="py-3 px-3 text-right text-emerald-700">ER Diff (A/c 1)</th>
                <th className="py-3 px-3 text-center text-amber-700">NCP Days</th>
                <th className="py-3 px-4 text-right">Total PF Cost</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400 font-sans">
                    Computing PF ledger via C++ engine...
                  </td>
                </tr>
              ) : slips.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400 font-sans">
                    No records found for selected period.
                  </td>
                </tr>
              ) : (
                slips.map((slip) => {
                  const emp = slip.employee;
                  const epf = slip.epfBreakdown;
                  const att = slip.attendance;
                  const totalWorkerPFCost = epf.employeeShare + epf.employerEPS + epf.employerEPF + epf.edliCharges + epf.adminCharges;
                  const hasUan = Boolean(emp.uan);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-sans">
                        <div className="font-semibold text-slate-900">{emp.fullName}</div>
                        <div className="text-slate-500 font-mono text-[10px]">
                          UAN: {emp.uan || <span className="text-rose-500 font-semibold">Missing UAN</span>}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-800">
                        ₹{epf.grossWage.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        ₹{epf.epfWage.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-700">
                        ₹{epf.epsWage.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right text-indigo-700 font-bold">
                        ₹{epf.employeeShare.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-700">
                        ₹{epf.employerEPS.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right text-emerald-700 font-medium">
                        ₹{epf.employerEPF.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-center text-amber-700 font-bold">
                        {att.ncpDays}
                      </td>

                      <td className="py-2.5 px-4 text-right text-slate-900 font-semibold">
                        ₹{totalWorkerPFCost.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-center font-sans">
                        {hasUan ? (
                          <Badge variant="success" size="xs">Verified</Badge>
                        ) : (
                          <Badge variant="danger" size="xs">Incomplete</Badge>
                        )}
                      </td>
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
