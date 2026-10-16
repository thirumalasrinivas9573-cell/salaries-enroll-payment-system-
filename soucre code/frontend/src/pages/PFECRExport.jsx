import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  CheckCircle2,
  Copy,
  ShieldCheck,
  Info,
  AlertTriangle,
  AlertCircle,
  XCircle,
  ExternalLink
} from 'lucide-react';
import Badge from '../components/common/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { api } from '../services/api';

export default function PFECRExport() {
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [validationData, setValidationData] = useState(null);
  const [ecrContent, setEcrContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('included'); // 'included', 'excluded', 'raw'
  const [copied, setCopied] = useState(false);

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
    setEcrContent('');
    try {
      const valRes = await api.validatePFECR(runId);
      setValidationData(valRes);

      // If finalized, fetch the raw text file for live preview
      if (valRes.isFinalized) {
        const textRes = await fetch(`/api/exports/pf-ecr?runId=${runId}`);
        if (textRes.ok) {
          const text = await textRes.text();
          setEcrContent(text);
        }
      }
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

  const handleCopy = () => {
    if (!ecrContent) return;
    navigator.clipboard.writeText(ecrContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>EPFO Unified Portal Compliance</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            EPFO ECR 2.0 Electronic Challan cum Return Generator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-export statutory validation report and verified #~# delimited return file for official portal upload.
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
            <a
              href={`/api/exports/pf-ecr?runId=${selectedRunId}`}
              download={`EPFO_ECR_2.0_${currentRun?.month}_${currentRun?.year}.txt`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Official .TXT File
            </a>
          )}
        </div>
      </div>

      {/* Official Government Portal Disclaimer Callout */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-800">Official Filing Notice:</strong> This module prepares files conforming to the current EPFO ECR 2.0 technical specification. The generated file must be manually uploaded to the official EPFO Unified Employer Portal by an authorized DSC signatory. This system does not automatically transmit data to government servers or claim official filing acceptance.
        </div>
      </div>

      {/* Unfinalized / Draft Warning */}
      {!isFinalized && validationData && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900">Payroll Run Not Finalized</h4>
            <p className="leading-relaxed">
              Batch {currentRun?.month}/{currentRun?.year} is currently saved as <strong>"{currentRun?.status}"</strong>. Statutory return files can only be exported after calculations have been formally reviewed and locked.
            </p>
          </div>
        </div>
      )}

      {/* Active Warnings */}
      {warnings.length > 0 && (
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-950 space-y-1.5">
          <div className="font-semibold text-sky-900 flex items-center gap-1.5 text-xs">
            <AlertCircle className="w-4 h-4 text-sky-600" />
            Statutory Exceptions & Warnings ({warnings.length})
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
            <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold">ECR Eligible Members</span>
            <div className="text-xl font-bold text-slate-900 mt-1 flex items-center justify-between">
              <span>{included.length}</span>
              <span className="text-xs font-sans text-emerald-700 font-medium">Valid ✓</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-slate-500 font-semibold">Excluded Records</span>
            <div className="text-xl font-bold text-slate-900 mt-1 flex items-center justify-between">
              <span className={excluded.length > 0 ? 'text-amber-700' : 'text-slate-700'}>{excluded.length}</span>
              <span className="text-xs font-sans text-slate-500 font-medium">Skipped</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-indigo-700 font-semibold">Total EPF Wages</span>
            <div className="text-lg font-bold text-indigo-700 mt-1">₹{summary.totalEpfWages.toLocaleString('en-IN')}</div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs">
            <span className="text-[10px] uppercase font-sans text-slate-700 font-semibold">Total PF Remittance</span>
            <div className="text-lg font-bold text-slate-800 mt-1">₹{summary.totalPFLiability.toLocaleString('en-IN')}</div>
          </div>
        </div>
      )}

      {/* Pre-Export Validation & Inspection Tabs */}
      <Card>
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 pt-3 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('included')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
              activeTab === 'included'
                ? 'text-indigo-700 border-b-2 border-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Valid & Included in ECR ({included.length})
          </button>

          <button
            onClick={() => setActiveTab('excluded')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
              activeTab === 'excluded'
                ? 'text-indigo-700 border-b-2 border-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-amber-500" />
            Excluded from Export ({excluded.length})
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
              activeTab === 'raw'
                ? 'text-indigo-700 border-b-2 border-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            Raw ECR 2.0 Text Preview
          </button>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">Validating payroll records...</div>
          ) : activeTab === 'included' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-3">UAN (12-Digit)</th>
                    <th className="py-2.5 px-3">Member Name</th>
                    <th className="py-2.5 px-2 text-right">Gross</th>
                    <th className="py-2.5 px-2 text-right text-indigo-700">EPF Wage</th>
                    <th className="py-2.5 px-2 text-right">EPS Wage</th>
                    <th className="py-2.5 px-2 text-right">EDLI Wage</th>
                    <th className="py-2.5 px-2 text-right text-slate-900 font-bold">EE (12%)</th>
                    <th className="py-2.5 px-2 text-right">EPS (8.33%)</th>
                    <th className="py-2.5 px-2 text-right">ER Diff</th>
                    <th className="py-2.5 px-2 text-center text-amber-700">NCP Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {included.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3 font-semibold text-slate-900">{item.uan}</td>
                      <td className="py-2 px-3 font-sans">
                        <strong className="text-slate-800 block">{item.fullName}</strong>
                        <span className="text-[10px] text-slate-500 font-mono">{item.empCode}</span>
                      </td>
                      <td className="py-2 px-2 text-right">₹{item.gross.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-2 text-right text-indigo-700 font-semibold">₹{item.epfWage.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-2 text-right">₹{item.epsWage.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-2 text-right">₹{item.edliWage.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-2 text-right font-bold text-slate-900">₹{item.eeShare.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-2 text-right">₹{item.epsShare.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-2 text-right">₹{item.erDiff.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-2 text-center text-amber-700 font-semibold">{item.ncpDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'excluded' ? (
            <div className="p-4">
              {excluded.length === 0 ? (
                <div className="py-8 text-center text-emerald-700 text-xs">
                  ✓ All employee records in this payroll run are valid and included in the EPFO ECR.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                        <th className="py-2 px-3">Employee</th>
                        <th className="py-2 px-3">UAN Status</th>
                        <th className="py-2 px-3 text-rose-700">Reason for Exclusion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {excluded.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3">
                            <strong className="text-slate-800">{item.fullName}</strong>
                            <span className="text-slate-500 font-mono text-[11px] block">{item.empCode}</span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">{item.uan}</td>
                          <td className="py-2 px-3 text-rose-700 font-medium">{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  Format: UAN#~#MemberName#~#Gross#~#EPFWage#~#EPSWage#~#EDLIWage#~#EEShare#~#EPSShare#~#ERDiff#~#NCPDays#~#Refund
                </span>
                <button
                  onClick={handleCopy}
                  disabled={!ecrContent}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                  {copied ? 'Copied' : 'Copy Text'}
                </button>
              </div>

              {!ecrContent ? (
                <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded">
                  Raw file preview available only for finalized payroll runs with valid records.
                </div>
              ) : (
                <pre className="p-4 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed">
                  {ecrContent}
                </pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
