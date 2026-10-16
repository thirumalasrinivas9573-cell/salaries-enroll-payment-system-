import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Play,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  FileSpreadsheet,
  FileText,
  FileCheck,
  RotateCcw,
  History,
  Lock,
  Layers
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { api } from '../services/api';
import PayslipModal from '../components/PayslipModal';

export default function PayrollProcessing({
  defaultMonth = 10,
  defaultYear = 2026,
  company,
  onNavigate
}) {
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedSlip, setSelectedSlip] = useState(null);

  // Review & Finalize Modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');

  useEffect(() => {
    handleRunEngine();
  }, [month, year]);

  const handleRunEngine = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.previewPayroll(month, year);
      setPreviewData(res);
      if (res.existingRun && res.existingRun.status === 'Finalized') {
        setIsRevisionMode(true);
      } else {
        setIsRevisionMode(false);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.saveDraftPayroll(month, year);
      setSuccessMsg(`Payroll draft for ${month}/${year} has been saved. You can inspect, adjust attendance, or finalize when ready.`);
      handleRunEngine();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleOpenFinalizeModal = () => {
    if (previewData?.existingRun?.status === 'Finalized') {
      setIsRevisionMode(true);
    } else {
      setIsRevisionMode(false);
    }
    setRevisionReason('');
    setShowReviewModal(true);
  };

  const handleFinalizeBatch = async () => {
    if (isRevisionMode && !revisionReason.trim()) {
      alert('Please enter an auditable revision reason before submitting.');
      return;
    }

    setFinalizing(true);
    setErrorMsg('');
    try {
      const payload = {
        isRevision: isRevisionMode,
        revisionReason: revisionReason.trim()
      };
      const res = await api.processPayroll(month, year, payload);
      setShowReviewModal(false);
      setSuccessMsg(
        isRevisionMode
          ? `Payroll Revision #${res.revisionNumber} finalized and committed for ${month}/${year} with audit trail.`
          : `Payroll batch for ${month}/${year} has been finalized and locked to persistent ledger!`
      );
      handleRunEngine();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setFinalizing(false);
    }
  };

  const summary = previewData?.summary;
  const slips = previewData?.slips || [];
  const existingRun = previewData?.existingRun;
  const rules = previewData?.rules;

  return (
    <div className="space-y-6">
      {/* Top Header & Engine Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-mono text-sky-700 font-semibold uppercase">
              C++17 OOP Calculation Subsystem Active
            </span>
            {rules && (
              <Badge variant={rules.verified ? 'success' : 'warning'} size="xs">
                Rules {rules.version} {rules.verified ? '• Verified ✓' : '• Pending Audit'}
              </Badge>
            )}
            {existingRun && (
              <Badge variant={existingRun.status === 'Finalized' ? 'purple' : 'info'} size="xs">
                {existingRun.status === 'Finalized'
                  ? `Finalized (Rev #${existingRun.revision_number || 1})`
                  : 'Draft Saved'}
              </Badge>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Payroll Processing Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluates prorated earnings, separate statutory wage bases, employee deductions, and employer contributions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs">
            <label className="text-slate-500 font-medium">Batch:</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="bg-transparent border-0 p-0 text-xs font-semibold text-slate-900 focus:ring-0"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1).toLocaleString('default', { month: 'short' })}
                </option>
              ))}
            </select>
            <span className="text-slate-300">/</span>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-transparent border-0 p-0 text-xs font-semibold text-slate-900 focus:ring-0"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <button
            onClick={handleRunEngine}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
            title="Recalculate through C++ engine"
          >
            <Play className={`w-3.5 h-3.5 text-sky-600 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Evaluating...' : 'Recalculate'}
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={savingDraft || !previewData || existingRun?.status === 'Finalized'}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
            title="Save calculation as Draft without locking"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            {savingDraft ? 'Saving Draft...' : 'Save Draft'}
          </button>

          <button
            onClick={handleOpenFinalizeModal}
            disabled={finalizing || !previewData}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-white text-xs font-semibold shadow-xs transition-colors ${
              existingRun?.status === 'Finalized'
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            {existingRun?.status === 'Finalized' ? (
              <>
                <History className="w-3.5 h-3.5" />
                Revise Finalized Payroll
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5" />
                Review & Finalize Batch
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error & Feedback Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
          {onNavigate && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('pf-ecr')}
                className="px-3 py-1 rounded bg-white hover:bg-slate-50 text-sky-700 border border-slate-300 font-semibold text-xs shadow-2xs"
              >
                EPFO ECR File →
              </button>
              <button
                onClick={() => onNavigate('esic-export')}
                className="px-3 py-1 rounded bg-white hover:bg-slate-50 text-amber-700 border border-slate-300 font-semibold text-xs shadow-2xs"
              >
                ESIC Excel →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold">Processed Workers</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{summary.totalEmployees}</div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold">Total Gross Earned</span>
            <div className="text-lg font-bold text-slate-900 mt-1">
              ₹{Number(summary.totalGrossEarned).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-emerald-700 font-semibold">Net Salary Payout</span>
            <div className="text-lg font-bold text-emerald-700 mt-1">
              ₹{Number(summary.totalNetPayable).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-rose-700 font-semibold">Employee Deductions</span>
            <div className="text-lg font-bold text-rose-700 mt-1">
              ₹{Number(summary.totalEmployeeDeductions).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-indigo-700 font-semibold">Employer PF + ESIC</span>
            <div className="text-lg font-bold text-indigo-700 mt-1">
              ₹{Number(summary.totalEmployerContributions).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold">Total Cost To Co (CTC)</span>
            <div className="text-lg font-bold text-slate-900 mt-1">
              ₹{Number(summary.totalCTC).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}

      {/* Calculated Register Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-slate-600" />
              <CardTitle>Calculated Payroll Register ({month}/{year})</CardTitle>
            </div>
            <div className="text-xs text-slate-500 font-sans">
              Formula: <strong>Net Pay = Gross Earnings − Employee Deductions</strong> (Employer costs separated)
            </div>
          </div>
          <CardDescription>
            {slips.length} employees calculated • Distinct PF/ESIC wage bases, transparent deductions, and net take-home
          </CardDescription>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-2 text-center">Paid / Cal</th>
                <th className="py-3 px-2 text-center text-amber-800">NCP</th>
                <th className="py-3 px-3 text-right">Gross Earned</th>
                <th className="py-3 px-3 text-right bg-indigo-50/50 text-indigo-900 font-bold">PF Wage Base</th>
                <th className="py-3 px-3 text-right bg-amber-50/50 text-amber-900 font-bold">ESIC Wage Base</th>
                <th className="py-3 px-3 text-right text-indigo-700">PF EE (12%)</th>
                <th className="py-3 px-3 text-right text-amber-700">ESIC EE (0.75%)</th>
                <th className="py-3 px-3 text-right text-rose-700">Other Ded.</th>
                <th className="py-3 px-3 text-right font-bold text-emerald-700">Net Pay</th>
                <th className="py-3 px-3 text-right text-slate-500">ER Statutory</th>
                <th className="py-3 px-4 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan="12" className="py-12 text-center text-slate-400 font-sans">
                    Executing C++17 OOP calculation engine...
                  </td>
                </tr>
              ) : slips.length === 0 ? (
                <tr>
                  <td colSpan="12" className="py-12 text-center text-slate-400 font-sans">
                    No records to preview.
                  </td>
                </tr>
              ) : (
                slips.map((slip) => {
                  const emp = slip.employee;
                  const att = slip.attendance;
                  const earn = slip.earnings;
                  const ded = slip.deductions;
                  const bases = slip.wageBases || {};
                  const costs = slip.employerCosts || {};
                  const otherDeds = (ded.advanceDeducted || 0) + (ded.otherDeductions || 0) + (ded.professionalTax || 0) + (ded.incomeTaxTDS || 0);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-sans">
                        <div className="font-semibold text-slate-900">{emp.fullName}</div>
                        <div className="text-slate-500 font-mono text-[10px]">{emp.empCode} • {emp.department}</div>
                      </td>

                      <td className="py-2.5 px-2 text-center text-slate-700">
                        {att.paidDays}/{att.calendarDays}
                      </td>

                      <td className="py-2.5 px-2 text-center text-amber-700 font-bold">
                        {att.ncpDays}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        ₹{earn.grossEarned.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right bg-indigo-50/30 text-indigo-900">
                        ₹{(bases.pfWageBase || 0).toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right bg-amber-50/30 text-amber-900">
                        ₹{(bases.esicWageBase || 0).toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right text-indigo-700 font-semibold">
                        ₹{ded.epfEmployee.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right text-amber-700 font-semibold">
                        ₹{ded.esicEmployee.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right text-rose-700" title={`Advance: ₹${ded.advanceDeducted || 0}, Other: ₹${ded.otherDeductions || 0}, PT: ₹${ded.professionalTax || 0}`}>
                        ₹{otherDeds.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right text-emerald-700 font-bold text-xs">
                        ₹{slip.netPayable.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-500 text-[10px]" title="Employer EPF+EPS+EDLI+Admin+ESIC (Not deducted from worker)">
                        ₹{(costs.totalEmployerStatutory || 0).toFixed(2)}
                      </td>

                      <td className="py-2.5 px-4 text-right font-sans">
                        <button
                          onClick={() => setSelectedSlip(slip)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                        >
                          Payslip
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review & Finalize Confirmation Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={isRevisionMode ? `Auditable Revision — ${month}/${year}` : `Finalize Payroll Batch — ${month}/${year}`}
        subtitle="Verify statutory wage bases, deductions, and liabilities before persistent database lock."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs text-slate-700">
          {isRevisionMode ? (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md text-indigo-900 leading-snug">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <History className="w-4 h-4 text-indigo-700" />
                Auditable Payroll Revision Required
              </div>
              A finalized payroll run already exists for {month}/{year}. To maintain statutory audit integrity, finalized payroll cannot be silently modified. Please state the justification for this revision (e.g. attendance correction, overtime regularized).
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 leading-snug">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <Lock className="w-4 h-4 text-amber-700" />
                Permanent Finalization Notice
              </div>
              Finalizing locks the calculation ledger for {month}/{year}. Once finalized, official EPFO ECR text files and ESIC monthly Excel return files can be generated.
            </div>
          )}

          {isRevisionMode && (
            <div>
              <label className="text-slate-800 font-semibold block mb-1">
                Revision Justification Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="e.g. Overtime adjustment for Machine Shopfloor workers regularized by Plant Manager"
                className="w-full text-xs rounded-md border-slate-300"
              />
            </div>
          )}

          {/* Snapshot Summary Box */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs">
            <div>
              <span className="text-slate-500 font-sans block text-[11px]">Period / Rule Version:</span>
              <strong className="text-slate-900 text-sm">{month} / {year} ({rules?.version || 'v2026.1'})</strong>
            </div>
            <div>
              <span className="text-slate-500 font-sans block text-[11px]">Active Workers:</span>
              <strong className="text-slate-900 text-sm">{summary?.totalEmployees}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-sans block text-[11px]">Total Gross Payroll:</span>
              <strong className="text-slate-900 text-sm">₹{Number(summary?.totalGrossEarned).toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span className="text-emerald-700 font-sans block text-[11px] font-semibold">Total Net Payout:</span>
              <strong className="text-emerald-700 text-sm">₹{Number(summary?.totalNetPayable).toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-sans block text-[11px]">Total Employee Deductions:</span>
              <strong className="text-rose-700 text-sm">₹{Number(summary?.totalEmployeeDeductions).toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-sans block text-[11px]">Employer Statutory Cost:</span>
              <strong className="text-indigo-700 text-sm">₹{Number(summary?.totalEmployerContributions).toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowReviewModal(false)}
              className="px-3.5 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleFinalizeBatch}
              disabled={finalizing || (isRevisionMode && !revisionReason.trim())}
              className={`px-4 py-1.5 rounded-md text-white font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50 ${
                isRevisionMode
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-sky-600 hover:bg-sky-700'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              {finalizing
                ? 'Processing Lock...'
                : isRevisionMode
                ? 'Confirm & Commit Revision'
                : 'Confirm & Lock Batch'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Payslip View Modal */}
      {selectedSlip && (
        <PayslipModal
          slip={selectedSlip}
          company={company}
          onClose={() => setSelectedSlip(null)}
        />
      )}
    </div>
  );
}
