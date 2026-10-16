import React, { useState, useEffect } from 'react';
import { X, Terminal, Cpu, CheckCircle2, ShieldCheck, RefreshCw, FileCode2 } from 'lucide-react';
import { api } from '../services/api';

export default function CppEngineModal({ isOpen, onClose }) {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('classes');

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await api.getHealth();
      setHealthData(res);
    } catch (e) {
      setHealthData({ status: 'offline', error: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) checkStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">C++17 OOP Core Calculation Subsystem</h3>
              <p className="text-xs text-slate-500">Academic Project Verification & Architecture Inspection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {/* Real-time Binary Status */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <div>
                <div className="font-mono text-xs text-slate-800">
                  Binary Path: <span className="text-sky-700 font-semibold">{healthData?.cppEngine?.binaryPath || './cpp_engine/bin/payroll_engine'}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Execution Mode: Child Process JSON-IPC (stdin/stdout streaming) + Standalone Terminal CLI
                </div>
              </div>
            </div>
            <button
              onClick={checkStatus}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Verify
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('classes')}
              className={`pb-2 transition-colors ${activeTab === 'classes' ? 'text-sky-700 border-b-2 border-sky-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              OOP Class Hierarchy & Concepts
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`pb-2 transition-colors ${activeTab === 'terminal' ? 'text-sky-700 border-b-2 border-sky-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Viva & Terminal Commands
            </button>
            <button
              onClick={() => setActiveTab('statutory')}
              className={`pb-2 transition-colors ${activeTab === 'statutory' ? 'text-sky-700 border-b-2 border-sky-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Statutory Logic Compliance
            </button>
          </div>

          {activeTab === 'classes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-sky-800 font-semibold mb-2">
                    <FileCode2 className="w-4 h-4 text-sky-600" />
                    <span>Polymorphism & Abstraction</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    Abstract base class <code className="text-sky-800 font-mono font-semibold">StatutoryCalculator</code> defines pure virtual methods:
                  </p>
                  <pre className="mt-2 p-2.5 rounded bg-white border border-slate-200 font-mono text-[11px] text-slate-800 overflow-x-auto">
{`class StatutoryCalculator {
public:
  virtual void calculate(double basicDA, 
                         double gross, 
                         int paid, 
                         int cal) = 0;
  virtual double getEmployeeContribution() const = 0;
  virtual double getEmployerContribution() const = 0;
};`}
                  </pre>
                  <p className="text-slate-600 mt-2 text-xs">
                    Polymorphic inheritance via <code className="text-slate-800 font-mono">EPFCalculator</code> and <code className="text-slate-800 font-mono">ESICCalculator</code>.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-sky-800 font-semibold mb-2">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>Encapsulation & Composition</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    <code className="text-slate-800 font-mono font-semibold">Employee</code> encapsulates private fields and composes a <code className="text-sky-800 font-mono">SalaryStructure</code> object.
                  </p>
                  <pre className="mt-2 p-2.5 rounded bg-white border border-slate-200 font-mono text-[11px] text-slate-800 overflow-x-auto">
{`class Employee {
private:
  int id;
  string uan;
  string esicIp;
  SalaryStructure salary; // HAS-A Composition
public:
  // Validated getters and setters
};`}
                  </pre>
                  <p className="text-slate-600 mt-2 text-xs">
                    Guarantees data integrity and prevents invalid state mutation.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wide mb-1">
                  Engine Orchestration (Facade Pattern)
                </h4>
                <p className="text-slate-600 leading-relaxed text-xs">
                  <code className="text-slate-900 font-mono font-semibold">PayrollEngine</code> acts as a Facade orchestrator that handles batch processing, daily wage proration, executes polymorphic calculators, computes employer liabilities, and generates official EPFO ECR 2.0 text and ESIC CSV format.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                You can run these terminal commands directly to demonstrate C++ execution to your college professor without touching the browser:
              </p>
              <div className="space-y-2.5 font-mono text-xs">
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-0.5"># 1. Compile C++ Engine:</span>
                  <span className="text-slate-900 font-semibold">cd cpp_engine && make clean && make</span>
                </div>
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-0.5"># 2. Run Automated Verification Test Suite (5/5 tests):</span>
                  <span className="text-sky-700 font-semibold">./bin/payroll_engine --test</span>
                </div>
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-0.5"># 3. Interactive Terminal Evaluator:</span>
                  <span className="text-indigo-700 font-semibold">./bin/payroll_engine --cli</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'statutory' && (
            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
                <h5 className="font-semibold text-slate-900 mb-1">EPFO Statutory Norms (1952 Act):</h5>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Wage Ceiling: ₹15,000 / month (Basic + DA)</li>
                  <li>Employee PF (A/c 01): 12% of EPF Wage</li>
                  <li>Employer EPS Pension (A/c 10): 8.33% capped at ₹1,250</li>
                  <li>Employer EPF Diff (A/c 01): Employee Share minus Employer EPS (~3.67%)</li>
                  <li>EDLI (A/c 21): 0.50% & Admin Charges (A/c 02): 0.50%</li>
                  <li>NCP Days: Non-Contributing Period days recorded in ECR 2.0 text format</li>
                </ul>
              </div>
              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
                <h5 className="font-semibold text-slate-900 mb-1">ESIC Statutory Norms (1948 Act):</h5>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Gross Wage Ceiling: ₹21,000 / month</li>
                  <li>Employee Contribution: 0.75% of Gross Wages</li>
                  <li>Employer Contribution: 3.25% of Gross Wages</li>
                  <li>Low-wage Exemption: If average daily wage &le; ₹176, employee share is 0%</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
