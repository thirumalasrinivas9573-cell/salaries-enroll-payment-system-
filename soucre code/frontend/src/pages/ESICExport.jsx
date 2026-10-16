import React, { useState, useEffect } from 'react';
import {
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  HeartPulse,
  Info,
  AlertTriangle,
  AlertCircle,
  XCircle,
  FileText
} from 'lucide-react';
import Badge from '../components/common/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { api } from '../services/api';

export default function ESICExport() {
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [validationData, setValidationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('included'); // 'included', 'excluded', 'codes'

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await api.getPayrollRuns();
      setRuns(res.data || []);
      if (res.data?.length > 0) {
        setSelectedRunId(res.data[0].id);
        loadValidation(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadValidation = async (runId) => {
    setLoading(true);
    setValidationData(null);
    try {
      const res = await api.validateESICExcel(runId);
      setValidationData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRun = (id) => {
    setSelectedRunId(id);
    loadValidation(id);
  };

  const currentRun = runs.find((r) => String(r.id) === String(selectedRunId));
  const isFinalized = validationData?.isFinalized;
  const included = validationData?.included || [];
  const excluded = validationData?.excluded || [];
  const warnings = validationData?.warnings || [];
  const summary = validationData?.summary;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs uppercase mb-1">
            <HeartPulse className="w-4 h-4" />
            <span>ESIC Employer Portal Integration</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            ESIC Monthly Contribution Upload File Generator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified monthly contribution returns generated in the official ESIC 6-column Excel (.xlsx) and CSV template.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <label className="text-xs text-slate-500 font-medium">Batch:</label>
          <select
            value={selectedRunId}
            onChange={(e) => handleSelectRun(e.target.value)}
            className="text-xs font-semibold text-slate-800"
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                Month {r.month}/{r.year} ({r.status})
              </option>
            ))}
          </select>

          {selectedRunId && isFinalized && included.length > 0 && (
            <div className="flex items-center gap-2">
              <a
                href={`/api/exports/esic-excel?runId=${selectedRunId}`}
                download={`ESIC_Monthly_Contribution_${currentRun?.month}_${currentRun?.year}.xlsx`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Download Excel (.xlsx)
              </a>
              <a
                href={`/api/exports/esic-csv?runId=${selectedRunId}`}
                download={`ESIC_Monthly_${currentRun?.month}_${currentRun?.year}.csv`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                CSV
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Official Disclaimer Callout */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-800">Official Filing Notice:</strong> The generated Excel workbook strictly follows the official 6-column ESIC Monthly Contribution upload format. The file must be submitted manually via the official ESIC Employer Portal (shramsuvidha / esic.gov.in) with employer credentials. The system does not directly post records to the portal.
        </div>
      </div>

      {/* Unfinalized / Draft Warning */}
      {!isFinalized && validationData && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900">Payroll Run Not Finalized</h4>
            <p className="leading-relaxed">
              Batch {currentRun?.month}/{currentRun?.year} is in <strong>"{currentRun?.status}"</strong> status. Official ESIC contribution files can only be exported after calculations have been formally finalized and locked.
            </p>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-950 space-y-1.5">
          <div className="font-semibold text-amber-900 flex items-center gap-1.5 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Exceptions & Zero Working Days Reason Codes ({warnings.length})
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
            {warnings.map((w, idx) => (
              <li key={idx}>
                <strong>{w.empCode} ({w.fullName}):</strong> {w.warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation Summary Metrics */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold">ESIC Eligible Workers</span>
            <div className="text-xl font-bold text-slate-900 mt-1 flex items-center justify-between">
              <span>{included.length}</span>
              <span className="text-xs font-sans text-emerald-700 font-medium">Included ✓</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold">Excluded Workers</span>
            <div className="text-xl font-bold text-slate-900 mt-1 flex items-center justify-between">
              <span className={excluded.length > 0 ? 'text-amber-700' : 'text-slate-700'}>{excluded.length}</span>
              <span className="text-xs font-sans text-slate-500 font-medium">Exempt</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-amber-700 font-semibold">Total ESIC Wages</span>
            <div className="text-lg font-bold text-amber-700 mt-1">₹{summary.totalWages.toLocaleString('en-IN')}</div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-slate-700 font-semibold">Total ESIC Remittance (4%)</span>
            <div className="text-lg font-bold text-slate-800 mt-1">₹{summary.totalESICContribution.toLocaleString('en-IN')}</div>
          </div>
        </div>
      )}

      {/* Main Validation Card */}
      <Card>
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 pt-3 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('included')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
              activeTab === 'included'
                ? 'text-amber-700 border-b-2 border-amber-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Official Excel Template Preview ({included.length})
          </button>

          <button
            onClick={() => setActiveTab('excluded')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
              activeTab === 'excluded'
                ? 'text-amber-700 border-b-2 border-amber-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-amber-500" />
            Excluded / Exempt Workers ({excluded.length})
          </button>

          <button
            onClick={() => setActiveTab('codes')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
              activeTab === 'codes'
                ? 'text-amber-700 border-b-2 border-amber-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-slate-600" />
            ESIC Portal Reason Codes Guide
          </button>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">Validating ESIC returns...</div>
          ) : activeTab === 'included' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-3 text-center">IP Number</th>
                    <th className="py-3 px-3">IP Name</th>
                    <th className="py-3 px-2 text-center">No of Days Paid</th>
                    <th className="py-3 px-3 text-right">Total Monthly Wages</th>
                    <th className="py-3 px-3 text-center">Reason Code</th>
                    <th className="py-3 px-2 text-center">Last Working Day</th>
                    <th className="py-3 px-2 text-right text-slate-300">EE (0.75%)</th>
                    <th className="py-3 px-2 text-right text-slate-300">ER (3.25%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {included.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">{item.ipNumber}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <strong className="text-slate-800 block">{item.fullName}</strong>
                        <span className="text-[10px] text-slate-500 font-mono">{item.empCode}</span>
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-800 font-bold">{item.paidDays}</td>
                      <td className="py-2.5 px-3 text-right text-amber-900 font-bold">₹{item.monthlyWages.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.reasonCode === '0'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {item.reasonCode} ({item.reasonCode === '0' ? 'Normal' : item.reasonDesc})
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-500">{item.lastWorkingDay || '—'}</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">₹{item.eeShare}</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">₹{item.erShare}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'excluded' ? (
            <div className="p-4">
              {excluded.length === 0 ? (
                <div className="py-8 text-center text-emerald-700 text-xs">
                  ✓ All workers are covered under ESIC and included in this return.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                        <th className="py-2 px-3">Employee</th>
                        <th className="py-2 px-3">IP Number Status</th>
                        <th className="py-2 px-3 text-rose-700">Reason for Exclusion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {excluded.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3">
                            <strong className="text-slate-800">{item.fullName}</strong>
                            <span className="text-slate-500 font-mono text-[11px] block">{item.empCode}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{item.ip}</td>
                          <td className="py-2.5 px-3 text-rose-700 font-medium">{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block font-mono">Code 0: Normal Working Days</strong>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Used for all employees who have worked 1 or more paid working days during the contribution month. Last Working Day is left blank.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block font-mono">Code 1: Out of Coverage (&gt; ₹21,000)</strong>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Used when employee's monthly wage increases beyond the ₹21,000 statutory limit during the contribution period.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block font-mono">Code 2: Left Service / Resigned</strong>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Mandatory when an insured person has resigned or left service. Last Working Day must be populated in DD/MM/YYYY format.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                  <strong className="text-slate-900 block font-mono">Code 9: Leave Without Pay (Loss of Pay / NCP)</strong>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Used when worker is still in active service but took full unpaid leave (0 paid days) in the month.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
