import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Building2,
  ShieldCheck,
  HeartPulse,
  Save,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { api } from '../services/api';

export default function SettingsRules({ onCompanyUpdated }) {
  const [rules, setRules] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingRules, setSavingRules] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const [rulesRes, compRes] = await Promise.all([
        api.getRules(),
        api.getCompany()
      ]);
      setRules(rulesRes.data);
      setCompany(compRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRules = async (e) => {
    e.preventDefault();
    setSavingRules(true);
    setFeedback({ text: '', type: '' });
    try {
      await api.updateRules(rules);
      setFeedback({ text: 'Statutory calculation parameters saved! Future payroll batches will apply these rates.', type: 'success' });
    } catch (err) {
      setFeedback({ text: err.message, type: 'error' });
    } finally {
      setSavingRules(false);
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSavingCompany(true);
    setFeedback({ text: '', type: '' });
    try {
      await api.updateCompany(company);
      setFeedback({ text: 'Company registration identifiers and signatory profile saved.', type: 'success' });
      if (onCompanyUpdated) onCompanyUpdated(company);
    } catch (err) {
      setFeedback({ text: err.message, type: 'error' });
    } finally {
      setSavingCompany(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-400 text-xs">Loading statutory configuration...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sky-700 font-semibold text-xs uppercase mb-1">
            <Sliders className="w-4 h-4" />
            <span>Establishment & Statutory Configuration</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Settings & Statutory Calculation Rules
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure EPFO caps, ESIC ceilings, employer rates, and company registration identifiers.
          </p>
        </div>
      </div>

      {/* Notice on Demo Data */}
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Academic & Demonstration Notice:</strong> This software environment is pre-configured with realistic synthetic employee profiles and standardized Indian statutory rates for college OOP project evaluation. Never present demo data as real company payroll without authorized KYC verification.
        </div>
      </div>

      {feedback.text && (
        <div className={`p-3.5 rounded-md text-xs font-medium flex items-center gap-2 ${
          feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Master Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-600" />
              <CardTitle>Company Registration & Profile</CardTitle>
            </div>
            <CardDescription>
              Establishment codes printed on payslips and exported in EPFO ECR / ESIC returns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Company / Establishment Name</label>
                <input
                  type="text"
                  required
                  value={company?.name || ''}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  className="w-full font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="text-slate-700 font-sans font-medium block mb-1">PF Establishment ID</label>
                  <input
                    type="text"
                    value={company?.establishment_id || ''}
                    onChange={(e) => setCompany({ ...company, establishment_id: e.target.value })}
                    placeholder="DLCPM1982736000"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-sans font-medium block mb-1">PF Code Number</label>
                  <input
                    type="text"
                    value={company?.pf_code || ''}
                    onChange={(e) => setCompany({ ...company, pf_code: e.target.value })}
                    placeholder="DL/CPM/1982736"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-sans font-medium block mb-1">17-digit ESIC Code</label>
                  <input
                    type="text"
                    value={company?.esic_code || ''}
                    onChange={(e) => setCompany({ ...company, esic_code: e.target.value })}
                    placeholder="11000876540001001"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-sans font-medium block mb-1">Company PAN</label>
                  <input
                    type="text"
                    value={company?.pan || ''}
                    onChange={(e) => setCompany({ ...company, pan: e.target.value.toUpperCase() })}
                    placeholder="AAACA9876Q"
                    className="w-full uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Registered Address</label>
                <textarea
                  rows="2"
                  value={company?.address || ''}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  className="w-full"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Authorized Signatory Name</label>
                  <input
                    type="text"
                    value={company?.signatory_name || ''}
                    onChange={(e) => setCompany({ ...company, signatory_name: e.target.value })}
                    placeholder="Vikram Singhania"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Signatory Designation</label>
                  <input
                    type="text"
                    value={company?.signatory_designation || ''}
                    onChange={(e) => setCompany({ ...company, signatory_designation: e.target.value })}
                    placeholder="Managing Director"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingCompany}
                  className="w-full py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingCompany ? 'Saving...' : 'Save Company Profile'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Statutory Calculation Rules Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <CardTitle>Statutory Rules & Formula Rates</CardTitle>
            </div>
            <CardDescription>
              Government statutory caps and contribution percentages applied by C++ engine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveRules} className="space-y-4 text-xs">
              {/* Rule Versioning & Effective Date */}
              <div className="space-y-2.5 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800 text-[11px] uppercase tracking-wide">
                    Statutory Rule Version & Effective Schedule
                  </h4>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                    {rules?.version || 'v2026.1'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <label className="text-slate-600 font-sans block mb-1">Rule Version Tag</label>
                    <input
                      type="text"
                      value={rules?.version || 'v2026.1'}
                      onChange={(e) => setRules({ ...rules, version: e.target.value })}
                      className="w-full font-mono text-xs"
                      placeholder="v2026.1"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-sans block mb-1">Effective Date</label>
                    <input
                      type="date"
                      value={rules?.effective_from ? rules.effective_from.substring(0, 10) : '2026-04-01'}
                      onChange={(e) => setRules({ ...rules, effective_from: e.target.value })}
                      className="w-full font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 block mb-1">PF Rounding Rule</label>
                    <select
                      value={rules?.pf_rounding || 'nearest'}
                      onChange={(e) => setRules({ ...rules, pf_rounding: e.target.value })}
                      className="w-full text-xs"
                    >
                      <option value="nearest">EPFO Nearest Rupee (std)</option>
                      <option value="exact">Exact 2 Decimals</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">ESIC Rounding Rule</label>
                    <select
                      value={rules?.esic_rounding || 'ceil'}
                      onChange={(e) => setRules({ ...rules, esic_rounding: e.target.value })}
                      className="w-full text-xs"
                    >
                      <option value="ceil">ESIC Next Higher Rupee (ceil)</option>
                      <option value="nearest">Nearest Rupee</option>
                      <option value="exact">Exact 2 Decimals</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* EPFO Rules */}
              <div className="space-y-2.5">
                <h4 className="font-semibold text-slate-800 text-[11px] uppercase tracking-wide">
                  Employees' Provident Fund (EPFO) Rules
                </h4>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <label className="text-slate-600 font-sans block mb-1">PF Wage Ceiling (₹)</label>
                    <input
                      type="number"
                      value={rules?.pf_wage_ceiling || 15000}
                      onChange={(e) => setRules({ ...rules, pf_wage_ceiling: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-sans block mb-1">EPS Monthly Cap (₹)</label>
                    <input
                      type="number"
                      value={rules?.eps_ceiling_amount || 1250}
                      onChange={(e) => setRules({ ...rules, eps_ceiling_amount: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-sans block mb-1">EE Share Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={rules?.pf_ee_rate || 12}
                      onChange={(e) => setRules({ ...rules, pf_ee_rate: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-sans block mb-1">EPS Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={rules?.eps_er_rate || 8.33}
                      onChange={(e) => setRules({ ...rules, eps_er_rate: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-sans block mb-1">EDLI Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={rules?.edli_rate || 0.5}
                      onChange={(e) => setRules({ ...rules, edli_rate: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-sans block mb-1">Admin Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={rules?.admin_rate || 0.5}
                      onChange={(e) => setRules({ ...rules, admin_rate: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* ESIC Rules */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <h4 className="font-semibold text-slate-800 text-[11px] uppercase tracking-wide">
                  Employees' State Insurance (ESIC) Rules
                </h4>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <label className="text-slate-600 font-sans block mb-1">Gross Wage Ceiling (₹)</label>
                    <input
                      type="number"
                      value={rules?.esic_wage_ceiling || 21000}
                      onChange={(e) => setRules({ ...rules, esic_wage_ceiling: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-sans block mb-1">Daily Exemption (₹)</label>
                    <input
                      type="number"
                      value={rules?.esic_min_daily_exempt || 176}
                      onChange={(e) => setRules({ ...rules, esic_min_daily_exempt: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-sans block mb-1">EE ESIC Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={rules?.esic_ee_rate || 0.75}
                      onChange={(e) => setRules({ ...rules, esic_ee_rate: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-sans block mb-1">ER ESIC Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={rules?.esic_er_rate || 3.25}
                      onChange={(e) => setRules({ ...rules, esic_er_rate: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Verification & Compliance Status */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${rules?.verified ? 'text-emerald-600' : 'text-amber-500'}`} />
                    <span className="font-semibold text-slate-900">Compliance Officer Verification</span>
                  </div>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(rules?.verified)}
                      onChange={(e) => setRules({ ...rules, verified: e.target.checked ? 1 : 0 })}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      {rules?.verified ? 'Verified & Locked' : 'Mark as Verified'}
                    </span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <label className="text-slate-500 block mb-0.5">Verified By</label>
                    <input
                      type="text"
                      value={rules?.verified_by || 'Corporate Compliance Officer'}
                      onChange={(e) => setRules({ ...rules, verified_by: e.target.value })}
                      className="w-full text-xs"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <span className={`text-[10px] leading-tight ${rules?.verified ? 'text-emerald-700' : 'text-amber-700 font-medium'}`}>
                      {rules?.verified
                        ? 'Statutory formulas verified: Payroll batches can be marked ready for submission.'
                        : 'Unverified: Batches will be saved as provisional drafts until verified.'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingRules}
                  className="w-full py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingRules ? 'Updating Rules...' : 'Save Statutory Rules & Version'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
