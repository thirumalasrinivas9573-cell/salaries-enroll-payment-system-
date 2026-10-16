import React, { useState, useEffect } from 'react';
import {
  History,
  Calendar,
  Eye,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Lock
} from 'lucide-react';
import Badge from '../components/common/Badge';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { api } from '../services/api';
import PayslipModal from '../components/PayslipModal';

export default function PayrollHistory({ company }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [runDetails, setRunDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activePayslip, setActivePayslip] = useState(null);

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await api.getPayrollRuns();
      setRuns(res.data || []);
      if (res.data?.length > 0) {
        handleViewRun(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRun = async (id) => {
    setSelectedRunId(id);
    setLoadingDetails(true);
    try {
      const res = await api.getRunDetails(id);
      setRunDetails(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sky-700 font-semibold text-xs uppercase mb-1">
            <History className="w-4 h-4" />
            <span>Audit & Historical Records</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Payroll History & Salary Slips Archive
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Archived monthly payroll runs locked in the database, with verified payslip printouts and export files.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading payroll history...</div>
      ) : runs.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-lg bg-white text-slate-400 text-xs">
          No finalized payroll batches found in database. Go to "Payroll Processing" to compute and lock your first month.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Batches List Sidebar */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
              Finalized Batches ({runs.length})
            </h4>
            {runs.map((r) => {
              const isSelected = selectedRunId === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => handleViewRun(r.id)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/70 border-sky-400 shadow-xs ring-1 ring-sky-400'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-sky-600" />
                      {new Date(r.year, r.month - 1).toLocaleString('default', { month: 'long' })} {r.year}
                    </span>
                    <div className="flex items-center gap-1">
                      {r.revision_number > 1 && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Rev #{r.revision_number}
                        </span>
                      )}
                      <Badge variant={r.status === 'Draft' ? 'warning' : 'success'} size="xs">
                        <Lock className="w-2.5 h-2.5 mr-1" />
                        {r.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 font-mono">
                    <span>Rule: {r.rule_version || 'v2026.1'}</span>
                    <span>{r.total_employees} Workers</span>
                  </div>

                  {r.revision_reason && (
                    <div className="mb-2 p-1.5 rounded bg-amber-50/80 border border-amber-200 text-[10px] text-amber-800 italic line-clamp-1">
                      "{r.revision_reason}"
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-600 pt-1 border-t border-slate-100">
                    <div>Gross: <strong className="text-slate-900">₹{Number(r.total_gross).toLocaleString('en-IN')}</strong></div>
                    <div>Net: <strong className="text-emerald-700">₹{Number(r.total_net).toLocaleString('en-IN')}</strong></div>
                    <div>PF Liab: <span className="text-indigo-700">₹{Number(r.total_pf_liability).toLocaleString('en-IN')}</span></div>
                    <div>ESIC: <span className="text-amber-700">₹{Number(r.total_esic_liability).toLocaleString('en-IN')}</span></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Run Slips Register */}
          <Card className="lg:col-span-2">
            <CardHeader
              action={
                runDetails && (
                  <div className="flex items-center gap-2 text-xs">
                    <a
                      href={`/api/exports/pf-ecr?runId=${runDetails.run.id}`}
                      download
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-indigo-700 font-semibold shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      ECR File
                    </a>
                    <a
                      href={`/api/exports/esic-csv?runId=${runDetails.run.id}`}
                      download
                      className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-amber-700 font-semibold shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      ESIC CSV
                    </a>
                  </div>
                )
              }
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="w-4 h-4 text-slate-600" />
                <CardTitle>
                  {runDetails ? `Batch ${runDetails.run.month}/${runDetails.run.year} Detailed Register` : 'Batch Register'}
                </CardTitle>
                {runDetails?.run?.revision_number > 1 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Revision #{runDetails.run.revision_number}
                  </span>
                )}
                {runDetails?.run?.rule_version && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                    Rule: {runDetails.run.rule_version}
                  </span>
                )}
              </div>
              <CardDescription>
                {runDetails
                  ? `Processed: ${new Date(runDetails.run.processed_at).toLocaleString()}${runDetails.run.revision_reason ? ` • Revision Reason: ${runDetails.run.revision_reason}` : ''}`
                  : 'Select a batch on the left'}
              </CardDescription>
            </CardHeader>

            {loadingDetails ? (
              <div className="py-16 text-center text-slate-400 text-xs">Loading batch records...</div>
            ) : !runDetails ? (
              <div className="py-16 text-center text-slate-400 text-xs">Select a batch on the left to inspect slips.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-2 text-center">Days</th>
                      <th className="py-2.5 px-2 text-right">Gross</th>
                      <th className="py-2.5 px-2 text-right text-indigo-700">PF Base</th>
                      <th className="py-2.5 px-2 text-right text-amber-700">ESIC Base</th>
                      <th className="py-2.5 px-2 text-right text-rose-700">Total Ded</th>
                      <th className="py-2.5 px-3 text-right text-emerald-700 font-bold">Net Pay</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {runDetails.slips?.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-sans">
                          <strong className="text-slate-900 block">{s.full_name}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">{s.emp_code} • {s.department}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-700">
                          {s.paid_days}
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-900 font-semibold">
                          ₹{Number(s.gross_earned).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right text-indigo-700">
                          ₹{Number(s.pf_wage_base || s.earned_basic || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right text-amber-700">
                          ₹{Number(s.esic_wage_base || s.gross_earned || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right text-rose-700">
                          ₹{Number(s.total_deductions).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-bold text-xs">
                          ₹{Number(s.net_payable).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-sans">
                          <button
                            onClick={() => setActivePayslip(s)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                          >
                            <Printer className="w-3 h-3 text-slate-600" />
                            Print
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Payslip Modal */}
      {activePayslip && (
        <PayslipModal
          slip={activePayslip}
          company={company}
          onClose={() => setActivePayslip(null)}
        />
      )}
    </div>
  );
}
