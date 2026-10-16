import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  HeartPulse,
  Banknote,
  TrendingUp,
  ArrowRight,
  FileCheck2,
  CalendarCheck2,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Info
} from 'lucide-react';
import StatCard from '../components/StatCard';
import Badge from '../components/common/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { api } from '../services/api';

export default function Dashboard({
  onNavigate,
  currentMonth,
  currentYear,
  validationWarnings = []
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, [currentMonth, currentYear]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardStats({ month: currentMonth, year: currentYear });
      setData(res.data || res.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const employees = data?.employees || {};
  const payroll = data?.payroll || {};
  const totalEmployees = employees.total !== undefined ? employees.total : (data?.totalEmployees || 0);
  const activeEmployees = employees.active !== undefined ? employees.active : (data?.activeEmployees || 0);
  const pfEnrolled = employees.withPF !== undefined ? employees.withPF : (data?.pfEnrolled || 0);
  const esicEnrolled = employees.withESIC !== undefined ? employees.withESIC : (data?.esicEnrolled || 0);
  const isCurrentMonthFinalized = payroll.status === 'Finalized';
  const recentRuns = data?.recentRuns || [];

  return (
    <div className="space-y-6">
      {/* Zero Employees Empty State Banner */}
      {totalEmployees === 0 && (
        <div className="p-6 bg-sky-50/70 border border-sky-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-sky-600 text-white shrink-0 mt-0.5">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                No employees registered yet
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Your MongoDB database is ready and connected. Click Add Employee to register your first worker and begin managing attendance, PF/ESIC wages, and payroll calculations.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('employees')}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      )}
      {/* Top Banner: Status & Overview */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant={isCurrentMonthFinalized ? 'success' : 'warning'}>
              {isCurrentMonthFinalized ? 'Month Finalized' : 'Payroll Pending Calculation'}
            </Badge>
            <span className="text-xs text-slate-500 font-mono">
              Period: {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })} {currentYear}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Payroll & Statutory Compliance Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Enterprise overview of monthly gross payroll, employee statutory deductions, employer PF & ESIC liabilities, and portal-ready export files.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('payroll-process')}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <CalendarCheck2 className="w-3.5 h-3.5" />
            Process Month Payroll
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Reports
          </button>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Workforce"
          value={totalEmployees}
          subtext={`Active: ${activeEmployees}`}
          icon={Users}
          color="sky"
        />
        <StatCard
          title="EPF Covered"
          value={pfEnrolled}
          subtext="Wages &le; ₹15,000 / Opted in"
          icon={ShieldCheck}
          color="indigo"
        />
        <StatCard
          title="ESIC Covered"
          value={esicEnrolled}
          subtext="Monthly Gross &le; ₹21,000"
          icon={HeartPulse}
          color="emerald"
        />
        <StatCard
          title="Gross Wages Payout"
          value={`₹${Number(payroll.totalGross || 0).toLocaleString('en-IN')}`}
          subtext={payroll.status !== 'Not Processed' ? `Batch ${currentMonth}/${currentYear} (${payroll.status})` : 'Awaiting calculation'}
          icon={Banknote}
          color="purple"
        />
      </div>

      {/* Financial Breakdown & Deductions vs Net */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Payroll Financials Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Payroll Financial Summary</CardTitle>
            <CardDescription>
              {payroll.status !== 'Not Processed' ? `Period ${currentMonth}/${currentYear} (${payroll.status})` : `No payroll run recorded for ${currentMonth}/${currentYear}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-slate-100 font-mono">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-sans font-medium text-slate-500 uppercase tracking-wide">
                  Total Gross Wages
                </span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  ₹{Number(payroll.totalGross || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] font-sans text-slate-400">Basic, DA, HRA, Allowances & OT</span>
              </div>

              <div className="p-4 rounded-lg bg-rose-50/50 border border-rose-100">
                <span className="text-[11px] font-sans font-medium text-rose-700 uppercase tracking-wide">
                  Employee Deductions
                </span>
                <div className="text-xl font-bold text-rose-700 mt-1">
                  ₹{Number(payroll.totalEmployeeDeductions || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] font-sans text-rose-500">PF (12%), ESIC (0.75%), PT, Advances</span>
              </div>

              <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-100">
                <span className="text-[11px] font-sans font-medium text-emerald-700 uppercase tracking-wide">
                  Net Take-Home Payroll
                </span>
                <div className="text-xl font-bold text-emerald-700 mt-1">
                  ₹{Number(payroll.totalNet || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] font-sans text-emerald-600">Disbursed to Bank Accounts</span>
              </div>
            </div>

            {/* Employer Contribution Summary */}
            <div className="mt-5">
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-3">
                Employer Statutory Contribution Breakdown (Company Cost)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-white border border-slate-200 rounded-md">
                  <span className="text-slate-500 font-sans block text-[11px]">EPF + EPS (12%):</span>
                  <strong className="text-slate-800 text-sm">
                    ₹{Number(payroll.totalPFLiability || 0).toLocaleString('en-IN')}
                  </strong>
                  <span className="text-[10px] font-sans text-slate-400 block mt-0.5">A/c 01 + A/c 10</span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-md">
                  <span className="text-slate-500 font-sans block text-[11px]">ESIC Employer (3.25%):</span>
                  <strong className="text-slate-800 text-sm">
                    ₹{Number(payroll.totalESICLiability || 0).toLocaleString('en-IN')}
                  </strong>
                  <span className="text-[10px] font-sans text-slate-400 block mt-0.5">Statutory 3.25%</span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-md">
                  <span className="text-slate-500 font-sans block text-[11px]">EDLI & Admin (1.0%):</span>
                  <strong className="text-slate-800 text-sm">
                    Included
                  </strong>
                  <span className="text-[10px] font-sans text-slate-400 block mt-0.5">A/c 21 & A/c 02</span>
                </div>

                <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-md">
                  <span className="text-sky-800 font-sans block text-[11px] font-semibold">Total Employer Liability:</span>
                  <strong className="text-sky-900 text-sm">
                    ₹{Number(payroll.totalEmployerContributions || 0).toLocaleString('en-IN')}
                  </strong>
                  <span className="text-[10px] font-sans text-sky-700 block mt-0.5">Challan Liabilities</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Pending Validation Warnings Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <CardTitle>Validation & Compliance Alerts</CardTitle>
            </div>
            <CardDescription>Pending items requiring HR / Admin action</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {validationWarnings.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>All active employee records have valid UAN, ESIC IP numbers, and complete attendance records.</span>
              </div>
            ) : (
              validationWarnings.map((warn, i) => (
                <div key={i} className="p-3 rounded-md bg-amber-50/70 border border-amber-200 text-xs">
                  <div className="font-semibold text-amber-900 flex items-center justify-between">
                    <span>{warn.title}</span>
                    <Badge variant="warning" size="xs">Action Needed</Badge>
                  </div>
                  <p className="text-slate-600 mt-1 leading-snug">{warn.message}</p>
                </div>
              ))
            )}

            <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-600" />
                Statutory Compliance Notes:
              </div>
              <p className="text-[11px] text-slate-500">
                • EPFO monthly ECR return must be filed by the 15th of every month.
              </p>
              <p className="text-[11px] text-slate-500">
                • ESIC monthly contributions must be paid online by the 15th of every month.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payroll Runs Table */}
      <Card>
        <CardHeader
          action={
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-sky-700 hover:text-sky-800 hover:underline flex items-center gap-1"
            >
              View Full History <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="w-4 h-4 text-slate-600" />
            <CardTitle>Recent Payroll Runs</CardTitle>
          </div>
          <CardDescription>Historical processed and finalized monthly payroll batches</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Processed Date</th>
                <th className="py-3 px-4 text-center">Workers</th>
                <th className="py-3 px-4 text-right">Gross Total</th>
                <th className="py-3 px-4 text-right">Net Payout</th>
                <th className="py-3 px-4 text-right">PF Liability</th>
                <th className="py-3 px-4 text-right">ESIC Liability</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {(!data?.recentRuns || data.recentRuns.length === 0) ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400 font-sans">
                    No payroll batches recorded yet. Navigate to "Payroll Processing" to calculate and lock your first month.
                  </td>
                </tr>
              ) : (
                data.recentRuns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                      {new Date(r.year, r.month - 1).toLocaleString('default', { month: 'short' })} {r.year}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-500">
                      {new Date(r.processed_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center font-sans font-medium text-slate-800">
                      {r.total_employees}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ₹{Number(r.total_gross).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      ₹{Number(r.total_net).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right text-indigo-700 font-medium">
                      ₹{Number(r.total_pf_liability).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right text-amber-700 font-medium">
                      ₹{Number(r.total_esic_liability).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <Badge variant="success" size="xs">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => onNavigate('history')}
                        className="px-2.5 py-1 text-xs font-semibold text-sky-700 hover:text-sky-800 hover:bg-sky-50 rounded transition-colors"
                      >
                        View Slips
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
