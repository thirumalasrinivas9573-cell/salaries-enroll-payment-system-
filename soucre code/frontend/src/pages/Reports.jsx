import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Building,
  CreditCard,
  TrendingUp,
  FileCheck2,
  CalendarCheck2,
  ShieldCheck,
  HeartPulse,
  History,
  Printer
} from 'lucide-react';
import Badge from '../components/common/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { api } from '../services/api';

export default function Reports() {
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [runDetails, setRunDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('neft'); // neft, summary, pf_report, esic_report, export_history
  const [exportHistory, setExportHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchRuns();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getExportHistory();
      setExportHistory(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchRuns = async () => {
    try {
      const res = await api.getPayrollRuns();
      setRuns(res.data || []);
      if (res.data?.length > 0) {
        setSelectedRunId(res.data[0].id);
        loadDetails(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (id) => {
    setLoading(true);
    try {
      const res = await api.getRunDetails(id);
      setRunDetails(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRun = (id) => {
    setSelectedRunId(id);
    loadDetails(id);
  };

  const slips = runDetails?.slips || [];
  const currentRun = runDetails?.run;

  // Department rollup
  const deptMap = {};
  slips.forEach((s) => {
    const dept = s.department || 'General';
    if (!deptMap[dept]) {
      deptMap[dept] = { count: 0, gross: 0, net: 0, ctc: 0 };
    }
    deptMap[dept].count += 1;
    deptMap[dept].gross += Number(s.gross_earned || 0);
    deptMap[dept].net += Number(s.net_payable || 0);
    deptMap[dept].ctc += Number(s.total_ctc || 0);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-700 font-semibold text-xs uppercase mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Statutory Reporting & Banking Exports</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Reports & Statutory Export Hub
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Download standard corporate bank NEFT payout sheets, department cost summaries, and audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Batch:</label>
          <select
            value={selectedRunId}
            onChange={(e) => handleSelectRun(e.target.value)}
            className="text-xs font-semibold text-slate-800"
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                Month {r.month}/{r.year} ({r.total_employees} workers)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold bg-white px-4 pt-2 rounded-t-lg border-t border-x shadow-2xs">
        <button
          onClick={() => setActiveTab('neft')}
          className={`pb-3 transition-colors flex items-center gap-1.5 ${
            activeTab === 'neft'
              ? 'text-sky-700 border-b-2 border-sky-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Bank NEFT Salary File
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-3 transition-colors flex items-center gap-1.5 ${
            activeTab === 'summary'
              ? 'text-sky-700 border-b-2 border-sky-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          Department Cost Summary
        </button>

        <button
          onClick={() => setActiveTab('pf_report')}
          className={`pb-3 transition-colors flex items-center gap-1.5 ${
            activeTab === 'pf_report'
              ? 'text-sky-700 border-b-2 border-sky-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          PF Contribution Statement
        </button>

        <button
          onClick={() => setActiveTab('esic_report')}
          className={`pb-3 transition-colors flex items-center gap-1.5 ${
            activeTab === 'esic_report'
              ? 'text-sky-700 border-b-2 border-sky-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5" />
          ESIC Contribution Statement
        </button>

        <button
          onClick={() => setActiveTab('export_history')}
          className={`pb-3 transition-colors flex items-center gap-1.5 ${
            activeTab === 'export_history'
              ? 'text-sky-700 border-b-2 border-sky-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Export History Log
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Generating report data...</div>
      ) : !runDetails ? (
        <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg bg-white">
          No finalized payroll batches found.
        </div>
      ) : (
        <div>
          {/* Tab 1: Bank NEFT */}
          {activeTab === 'neft' && (
            <Card>
              <CardHeader
                action={
                  <a
                    href={`/api/exports/bank-neft?runId=${selectedRunId}`}
                    download
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Bank NEFT CSV
                  </a>
                }
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <CardTitle>Bank NEFT Direct Account Payout Statement</CardTitle>
                </div>
                <CardDescription>
                  Formatted for corporate internet banking bulk upload (SBI, HDFC, PNB, ICICI format)
                </CardDescription>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-3 px-4">Beneficiary Name</th>
                      <th className="py-3 px-4">Bank Name</th>
                      <th className="py-3 px-4 font-mono">Account Number</th>
                      <th className="py-3 px-4 font-mono">IFSC Code</th>
                      <th className="py-3 px-4 text-right">Net Payable Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {slips.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">
                          {s.full_name}
                        </td>
                        <td className="py-2.5 px-4 font-sans text-slate-600">
                          {s.bank_name || 'State Bank of India'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-800">
                          {s.bank_account || 'N/A'}
                        </td>
                        <td className="py-2.5 px-4 text-sky-700 font-bold">
                          {s.ifsc || 'N/A'}
                        </td>
                        <td className="py-2.5 px-4 text-right text-emerald-700 font-bold">
                          ₹{Number(s.net_payable).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Tab 2: Department Summary */}
          {activeTab === 'summary' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <CardTitle>Department-wise Cost Allocation</CardTitle>
                </div>
                <CardDescription>
                  Breakdown of employee gross wages, net pay, and total employer CTC cost per department
                </CardDescription>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold">
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4 text-center">Headcount</th>
                      <th className="py-3 px-4 text-right">Gross Wages</th>
                      <th className="py-3 px-4 text-right text-emerald-700">Net Take-Home</th>
                      <th className="py-3 px-4 text-right text-indigo-700">Total Employer CTC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {Object.entries(deptMap).map(([dept, val]) => (
                      <tr key={dept} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-sans font-bold text-slate-900">{dept}</td>
                        <td className="py-3 px-4 text-center text-slate-700">{val.count}</td>
                        <td className="py-3 px-4 text-right text-slate-900">₹{val.gross.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-emerald-700">₹{val.net.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-indigo-700 font-bold">₹{val.ctc.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Tab 3: PF Report */}
          {activeTab === 'pf_report' && (
            <Card>
              <CardHeader
                action={
                  <a
                    href={`/api/exports/pf-ecr?runId=${selectedRunId}`}
                    download
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download ECR Text File
                  </a>
                }
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <CardTitle>PF Contribution Statement</CardTitle>
                </div>
                <CardDescription>
                  Audit statement of EPF, EPS, EDLI, and administrative charges
                </CardDescription>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold">
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4 font-mono">UAN</th>
                      <th className="py-3 px-3 text-right">EPF Wages</th>
                      <th className="py-3 px-3 text-right text-indigo-700 font-bold">EE Share (12%)</th>
                      <th className="py-3 px-3 text-right">EPS Share</th>
                      <th className="py-3 px-3 text-right text-emerald-700">ER EPF Diff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {slips.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">{s.full_name}</td>
                        <td className="py-2.5 px-4 text-slate-700">{s.uan || '-'}</td>
                        <td className="py-2.5 px-3 text-right text-slate-800">₹{Number(s.earned_basic + s.earned_da).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right text-indigo-700 font-bold">₹{Number(s.epf_employee).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-700">₹{Number(s.employer_eps).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-700">₹{Number(s.employer_epf).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Tab 4: ESIC Report */}
          {activeTab === 'esic_report' && (
            <Card>
              <CardHeader
                action={
                  <a
                    href={`/api/exports/esic-csv?runId=${selectedRunId}`}
                    download
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download ESIC CSV File
                  </a>
                }
              >
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  <CardTitle>ESIC Contribution Statement</CardTitle>
                </div>
                <CardDescription>
                  Audit statement of ESIC monthly returns and insured person contributions
                </CardDescription>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold">
                      <th className="py-3 px-4">Insured Person</th>
                      <th className="py-3 px-4 font-mono">IP Number</th>
                      <th className="py-3 px-3 text-center">Paid Days</th>
                      <th className="py-3 px-3 text-right">ESIC Wages</th>
                      <th className="py-3 px-3 text-right text-rose-700 font-bold">EE Share (0.75%)</th>
                      <th className="py-3 px-3 text-right text-amber-700">ER Share (3.25%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {slips.filter(s => s.esic_ip).map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">{s.full_name}</td>
                        <td className="py-2.5 px-4 text-slate-700">{s.esic_ip}</td>
                        <td className="py-2.5 px-3 text-center text-slate-700">{s.paid_days}</td>
                        <td className="py-2.5 px-3 text-right text-slate-900">₹{Number(s.gross_earned).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right text-rose-700 font-bold">₹{Number(s.esic_employee).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right text-amber-700">₹{Number(s.employer_esic).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Tab 5: Export History */}
          {activeTab === 'export_history' && (
            <div className="space-y-6">
              {/* Quick Generation Links for Selected Run */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                    <CardTitle>Generate Statutory Portal Files for Batch {currentRun?.month}/{currentRun?.year}</CardTitle>
                  </div>
                  <CardDescription>
                    Official upload-ready formats verified against current EPFO ECR and ESIC specifications
                  </CardDescription>
                </CardHeader>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-200 space-y-2">
                    <div className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-700" />
                      EPFO ECR 2.0 Text File
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Official #~# delimited return with 11 statutory fields for EPFO Unified Portal.
                    </p>
                    <div className="pt-1">
                      <a
                        href={`/api/exports/pf-ecr?runId=${selectedRunId}`}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download ECR .TXT
                      </a>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-2">
                    <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                      ESIC Official Excel Return
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Authentic 6-column .xlsx workbook conforming to ESIC Employer Portal upload template.
                    </p>
                    <div className="pt-1">
                      <a
                        href={`/api/exports/esic-excel?runId=${selectedRunId}`}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download ESIC .XLSX
                      </a>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-sky-50/50 border border-sky-200 space-y-2">
                    <div className="font-bold text-sky-950 text-xs flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-sky-700" />
                      Bank NEFT Salary Transfer
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Corporate net salary payout sheet with Account Number, Beneficiary Name, and IFSC.
                    </p>
                    <div className="pt-1">
                      <a
                        href={`/api/exports/bank-neft?runId=${selectedRunId}`}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download NEFT .CSV
                      </a>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Historical Export Audit Log Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-600" />
                    <CardTitle>Export Generation Audit History ({exportHistory.length} Runs)</CardTitle>
                  </div>
                  <CardDescription>
                    Historical log of statutory files prepared, verified, and downloaded with timestamp tracking
                  </CardDescription>
                </CardHeader>
                <div className="overflow-x-auto">
                  {loadingHistory ? (
                    <div className="py-8 text-center text-slate-400 text-xs">Loading export logs...</div>
                  ) : exportHistory.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No files exported yet. Generate your first export above.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">File Name</th>
                          <th className="py-2.5 px-2 text-center">Period</th>
                          <th className="py-2.5 px-2 text-center">Format</th>
                          <th className="py-2.5 px-2 text-center">Valid / Excl</th>
                          <th className="py-2.5 px-3 text-right">Total Wages</th>
                          <th className="py-2.5 px-3 text-right">Total Contrib</th>
                          <th className="py-2.5 px-3">Generated By</th>
                          <th className="py-2.5 px-3 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {exportHistory.map((h) => (
                          <tr key={h.id} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-sans">
                              <Badge
                                variant={
                                  h.export_type === 'EPFO_ECR'
                                    ? 'primary'
                                    : h.export_type === 'ESIC_EXCEL'
                                    ? 'success'
                                    : 'neutral'
                                }
                                size="xs"
                              >
                                {h.export_type}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900 font-mono">
                              {h.file_name}
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-700">
                              {h.month}/{h.year}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {h.file_format}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center font-sans">
                              <span className="text-emerald-700 font-semibold">{h.included_records}</span>
                              <span className="text-slate-400"> / </span>
                              <span className={h.excluded_records > 0 ? 'text-amber-700 font-semibold' : 'text-slate-500'}>
                                {h.excluded_records}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-900">
                              ₹{Number(h.total_wages || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 text-right text-indigo-700 font-semibold">
                              ₹{Number(h.total_contributions || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 font-sans text-slate-600">
                              {h.generated_by || 'Authorized User'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-sans text-slate-500 text-[10px]">
                              {new Date(h.generated_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
