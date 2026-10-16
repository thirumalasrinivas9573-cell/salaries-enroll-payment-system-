import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Download,
  CalendarCheck2,
  ArrowRight,
  Info,
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Badge from '../components/common/Badge';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { api } from '../services/api';

export default function ESICProcessing({ currentMonth = 10, currentYear = 2026, onNavigateToESICExport }) {
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMonth(currentMonth);
    setYear(currentYear);
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchESICData();
  }, [month, year]);

  const fetchESICData = async () => {
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
          <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs uppercase mb-1">
            <HeartPulse className="w-4 h-4" />
            <span>Employees' State Insurance Act 1948</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            ESIC Management & Contribution Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated statutory compliance for ₹21,000 monthly gross limit, low-wage exemption (&le; ₹176/day), 0.75% EE share, and 3.25% ER liability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToESICExport && (
            <button
              onClick={onNavigateToESICExport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Generate ESIC Excel / CSV File
            </button>
          )}
        </div>
      </div>

      {/* Statutory Rules & Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-200 text-xs text-amber-950 space-y-2">
          <div className="font-semibold text-amber-900 flex items-center gap-1.5 text-sm">
            <Info className="w-4 h-4 text-amber-600" />
            ESIC Statutory Calculation Methodology
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed text-[11px]">
            <li><strong>Coverage Ceiling:</strong> Workers with fixed monthly gross salary up to <strong>₹21,000</strong> are covered under ESIC.</li>
            <li><strong>Out of Coverage:</strong> If monthly gross exceeds ₹21,000, worker is marked <strong>Exempt</strong> unless previously covered.</li>
            <li><strong>Employee Share:</strong> 0.75% of earned gross wages (rounded up to next higher rupee as per ESIC portal norms).</li>
            <li><strong>Employer Share:</strong> 3.25% of earned gross wages (rounded up to next rupee). Total liability: 4.0%.</li>
            <li><strong>Daily Wage Exemption:</strong> If average daily wage (Gross / Paid Days) is <strong>&le; ₹176 / day</strong>, employee share is <strong>0% (Exempt)</strong> while employer still pays 3.25%.</li>
          </ul>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
          <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Active Validation Warnings & Coverage Status
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="p-2 rounded bg-white border border-slate-200 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>ESIC Wage Base:</strong> Total earned gross (including overtime and allowances) is factored into ESIC wages.</span>
            </div>
            <div className="p-2 rounded bg-white border border-slate-200 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span><strong>Ceiling Exemption:</strong> High-income employees with gross &gt; ₹21k (e.g. Amitabh Sharma) are legally excluded from deductions.</span>
            </div>
            <div className="p-2 rounded bg-white border border-slate-200 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Zero-Days Reporting:</strong> If paid days are 0, Reason Code 9 (Leave Without Pay) is attached for monthly returns.</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold">Covered IP Count</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{slips.filter(s => !s.employee.esicOptOut && s.employee.esicIp && s.esicBreakdown.eligible).length}</div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-rose-700 font-semibold">EE ESIC (0.75%)</span>
            <div className="text-lg font-bold text-rose-700 mt-1">₹{summary.totalEmployeeESIC.toFixed(2)}</div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-amber-700 font-semibold">ER ESIC (3.25%)</span>
            <div className="text-lg font-bold text-amber-700 mt-1">₹{summary.totalEmployerESIC.toFixed(2)}</div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-emerald-700 font-semibold">Total ESIC Pool (4%)</span>
            <div className="text-lg font-bold text-emerald-700 mt-1">₹{summary.totalESICLiability.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* ESIC Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <CardTitle>ESIC Monthly Contribution Register</CardTitle>
          </div>
          <CardDescription>
            Individual breakdown of ESIC gross wages, average daily wage, low-wage exemption, and contributions
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Insured Person (IP) & Name</th>
                <th className="py-3 px-2 text-center">Paid Days</th>
                <th className="py-3 px-3 text-right">ESIC Wages</th>
                <th className="py-3 px-3 text-right">Avg Daily Wage</th>
                <th className="py-3 px-3 text-center">Exemption (&le;₹176)</th>
                <th className="py-3 px-3 text-right text-rose-700 font-bold">EE Share (0.75%)</th>
                <th className="py-3 px-3 text-right text-amber-700">ER Share (3.25%)</th>
                <th className="py-3 px-4 text-right text-emerald-700 font-bold">Total (4.00%)</th>
                <th className="py-3 px-3 text-center">Coverage Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 font-sans">
                    Computing ESIC ledger via C++ engine...
                  </td>
                </tr>
              ) : slips.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 font-sans">
                    No records found for selected period.
                  </td>
                </tr>
              ) : (
                slips.map((slip) => {
                  const emp = slip.employee;
                  const esic = slip.esicBreakdown;
                  const att = slip.attendance;
                  const avgDaily = att.paidDays > 0 ? (esic.esicWage / att.paidDays) : 0;
                  const isEligible = esic.eligible;
                  const hasIp = Boolean(emp.esicIp);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-sans">
                        <div className="font-semibold text-slate-900">{emp.fullName}</div>
                        <div className="text-slate-500 font-mono text-[10px]">
                          IP: {emp.esicIp || <span className="text-slate-400">Exempt</span>}
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center text-slate-700">
                        {att.paidDays}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        ₹{esic.esicWage.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-600">
                        ₹{avgDaily.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-center font-sans">
                        {esic.isDailyWageExempt ? (
                          <Badge variant="warning" size="xs">Exempt (0%)</Badge>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Normal</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right text-rose-700 font-bold">
                        ₹{esic.employeeShare.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right text-amber-700">
                        ₹{esic.employerShare.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-4 text-right text-emerald-700 font-bold">
                        ₹{esic.totalContribution.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-center font-sans">
                        {!isEligible ? (
                          <Badge variant="neutral" size="xs">Gross &gt; ₹21k</Badge>
                        ) : !hasIp ? (
                          <Badge variant="danger" size="xs">Missing IP</Badge>
                        ) : (
                          <Badge variant="success" size="xs">Covered</Badge>
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
