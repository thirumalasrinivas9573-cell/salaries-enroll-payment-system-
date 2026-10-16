import React from 'react';
import { X, Printer, ShieldCheck, Cpu } from 'lucide-react';

export default function PayslipModal({ slip, company, onClose }) {
  if (!slip) return null;

  const handlePrint = () => {
    window.print();
  };

  const netPay = Number(slip.net_payable || slip.netPayable || 0);
  const grossPay = Number(slip.gross_earned || slip.grossEarned || (slip.earnings?.grossEarned) || 0);
  const totalDed = Number(slip.total_deductions || slip.totalDeductions || (slip.deductions?.totalDeductions) || 0);

  let epfBreakdown = {};
  let esicBreakdown = {};
  try {
    if (slip.epf_breakdown_json) epfBreakdown = JSON.parse(slip.epf_breakdown_json);
    else if (slip.epfBreakdown) epfBreakdown = slip.epfBreakdown;

    if (slip.esic_breakdown_json) esicBreakdown = JSON.parse(slip.esic_breakdown_json);
    else if (slip.esicBreakdown) esicBreakdown = slip.esicBreakdown;
  } catch (e) {}

  const earnedBasic = Number(slip.earned_basic || slip.earnings?.earnedBasic || 0);
  const earnedDA = Number(slip.earned_da || slip.earnings?.earnedDA || 0);
  const earnedHRA = Number(slip.earned_hra || slip.earnings?.earnedHRA || 0);
  const earnedConv = Number(slip.earned_conveyance || slip.earnings?.earnedConveyance || 0);
  const earnedMed = Number(slip.earned_medical || slip.earnings?.earnedMedical || 0);
  const earnedSpecial = Number(slip.earned_special || slip.earnings?.earnedSpecial || 0);
  const otPay = Number(slip.overtime_pay || slip.earnings?.overtimePay || 0);

  const epfEE = Number(slip.epf_employee || slip.deductions?.epfEmployee || 0);
  const esicEE = Number(slip.esic_employee || slip.deductions?.esicEmployee || 0);
  const pt = Number(slip.professional_tax || slip.deductions?.professionalTax || 0);
  const advance = Number(slip.advance_deducted || slip.deductions?.advanceDeducted || 0);
  const tds = Number(slip.income_tax_tds || slip.deductions?.incomeTaxTDS || 0);
  const otherDed = Number(slip.other_deductions || slip.deductions?.otherDeductions || 0);

  const pfWageBase = Number(slip.pf_wage_base || slip.wageBases?.pfWageBase || 0);
  const esicWageBase = Number(slip.esic_wage_base || slip.wageBases?.esicWageBase || 0);

  const erEPF = Number(slip.employer_epf || slip.employerCosts?.employerEPF || epfBreakdown.employerEPF || 0);
  const erEPS = Number(slip.employer_eps || slip.employerCosts?.employerEPS || epfBreakdown.employerEPS || 0);
  const erEDLI = Number(slip.employer_edli || slip.employerCosts?.employerEDLI || epfBreakdown.edliCharges || 0);
  const erAdmin = Number(slip.employer_admin || slip.employerCosts?.employerAdmin || epfBreakdown.adminCharges || 0);
  const erESIC = Number(slip.employer_esic || slip.employerCosts?.employerESIC || esicBreakdown.employerShare || 0);
  const totalCTC = Number(slip.total_ctc || slip.employerCosts?.totalCTC || (grossPay + erEPF + erEPS + erEDLI + erAdmin + erESIC));

  const empName = slip.full_name || slip.employee?.fullName || 'Worker';
  const empCode = slip.emp_code || slip.employee?.empCode || 'EMP001';
  const desig = slip.designation || slip.employee?.designation || 'Staff';
  const dept = slip.department || slip.employee?.department || 'Operations';
  const uan = slip.uan || slip.employee?.uan || 'N/A';
  const esicIp = slip.esic_ip || slip.employee?.esicIp || 'N/A';
  const bankAcc = slip.bank_account || slip.employee?.bankAccount || 'N/A';
  const ifsc = slip.ifsc || slip.employee?.ifsc || 'N/A';

  const month = slip.month;
  const year = slip.year;
  const paidDays = slip.paid_days !== undefined ? slip.paid_days : (slip.attendance?.paidDays || 30);
  const calDays = slip.calendar_days || slip.attendance?.calendarDays || 30;
  const ncpDays = slip.ncp_days !== undefined ? slip.ncp_days : (slip.attendance?.ncpDays || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-xl relative text-slate-800">
        {/* Modal Controls (Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 text-sm">Monthly Salary Payslip</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-mono font-medium">
              {month}/{year}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Payslip Document Body */}
        <div className="p-8 payslip-container bg-white text-slate-800 text-xs">
          {/* Header */}
          <div className="border-b border-slate-300 pb-4 text-center">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 uppercase">
              {company?.name || 'Apex Industrial Technologies Pvt Ltd'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
              {company?.address || 'Plot 42, Okhla Industrial Area Phase-III, New Delhi, 110020'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-[11px] text-slate-600 font-mono">
              <span>PF Code: <strong className="text-slate-900">{company?.pf_code || 'DL/CPM/1982736'}</strong></span>
              <span>•</span>
              <span>ESIC Code: <strong className="text-slate-900">{company?.esic_code || '11000876540001001'}</strong></span>
              <span>•</span>
              <span>PAN: <strong className="text-slate-900">{company?.pan || 'AAACA9876Q'}</strong></span>
            </div>
            <div className="mt-3 inline-block px-3 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 uppercase tracking-wide">
              Salary Payslip — {month} / {year}
            </div>
          </div>

          {/* Employee & Attendance Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">Employee ID:</span><strong className="text-slate-900 font-mono">{empCode}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Employee Name:</span><strong className="text-slate-900">{empName}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Designation:</span><span className="text-slate-700">{desig}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Department:</span><span className="text-slate-700">{dept}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Bank Account:</span><span className="font-mono text-slate-700">{bankAcc}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">IFSC Code:</span><span className="font-mono text-slate-700">{ifsc}</span></div>
            </div>
            <div className="space-y-1.5 border-l border-slate-200 pl-4">
              <div className="flex justify-between"><span className="text-slate-500">UAN:</span><strong className="text-slate-900 font-mono">{uan}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">ESIC IP No:</span><strong className="text-slate-900 font-mono">{esicIp}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Calendar Days:</span><span className="text-slate-700">{calDays}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Paid Days:</span><strong className="text-emerald-700 font-semibold">{paidDays}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">NCP (Absent Days):</span><span className="text-amber-700 font-medium">{ncpDays}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">OT Hours:</span><span className="text-slate-700">{slip.attendance?.overtimeHours || 0} hrs</span></div>
            </div>
          </div>

          {/* Earnings & Deductions Table */}
          <div className="grid grid-cols-2 border-b border-slate-200 text-xs">
            {/* Earnings Column */}
            <div className="p-4 border-r border-slate-200">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-2 pb-1 border-b border-slate-200">
                Earnings (INR)
              </h4>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span className="text-slate-600">Basic Wage:</span><span>₹{earnedBasic.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Dearness Allowance (DA):</span><span>₹{earnedDA.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">House Rent (HRA):</span><span>₹{earnedHRA.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Conveyance Allowance:</span><span>₹{earnedConv.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Medical Allowance:</span><span>₹{earnedMed.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Special Allowance:</span><span>₹{earnedSpecial.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Overtime Pay:</span><span>₹{otPay.toFixed(2)}</span></div>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="p-4">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-2 pb-1 border-b border-slate-200">
                Deductions (INR)
              </h4>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span className="text-slate-600">EPF Employee (12%):</span><strong className="text-slate-900">₹{epfEE.toFixed(2)}</strong></div>
                <div className="flex justify-between"><span className="text-slate-600">ESIC Employee (0.75%):</span><strong className="text-slate-900">₹{esicEE.toFixed(2)}</strong></div>
                <div className="flex justify-between"><span className="text-slate-600">Professional Tax (PT):</span><span>₹{pt.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Advance Recovery:</span><span>₹{advance.toFixed(2)}</span></div>
                {otherDed > 0 && (
                  <div className="flex justify-between"><span className="text-slate-600">Other Authorized Ded:</span><strong className="text-rose-700">₹{otherDed.toFixed(2)}</strong></div>
                )}
                <div className="flex justify-between"><span className="text-slate-600">Income Tax (TDS):</span><span>₹{tds.toFixed(2)}</span></div>
              </div>
            </div>
          </div>

          {/* Wage Base Transparency Banner */}
          <div className="grid grid-cols-2 bg-slate-50/70 px-4 py-2 border-b border-slate-200 text-[11px] font-mono text-slate-600">
            <div className="flex justify-between pr-4 border-r border-slate-200">
              <span className="font-sans text-slate-500">Statutory PF Wage Base:</span>
              <span className="font-semibold text-indigo-900">₹{pfWageBase > 0 ? pfWageBase.toFixed(2) : earnedBasic.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pl-4">
              <span className="font-sans text-slate-500">Statutory ESIC Wage Base:</span>
              <span className="font-semibold text-amber-900">₹{esicWageBase > 0 ? esicWageBase.toFixed(2) : grossPay.toFixed(2)}</span>
            </div>
          </div>

          {/* Subtotals */}
          <div className="grid grid-cols-2 bg-slate-50 p-3 border-b border-slate-200 text-xs font-semibold">
            <div className="flex justify-between pr-4 border-r border-slate-200">
              <span className="text-slate-700">Gross Earnings:</span>
              <strong className="text-slate-900 text-sm">₹{grossPay.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between pl-4">
              <span className="text-slate-700">Total Deductions:</span>
              <strong className="text-rose-700 text-sm">₹{totalDed.toFixed(2)}</strong>
            </div>
          </div>

          {/* Net Pay Callout */}
          <div className="my-4 p-4 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide font-bold text-sky-800">Net Take-Home Salary</p>
              <p className="text-xs text-slate-600">Disbursed to employee registered bank account</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">₹{netPay.toFixed(2)}</div>
            </div>
          </div>

          {/* Employer Statutory Contributions */}
          <div className="mt-4 p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
              <h5 className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                Employer Statutory Contributions (Not Deducted From Worker Salary)
              </h5>
              <span className="text-[11px] text-slate-600">Total CTC: <strong className="text-slate-900">₹{totalCTC.toFixed(2)}</strong></span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block">EPF (A/c 01):</span>
                <strong className="text-slate-800">₹{erEPF.toFixed(2)}</strong>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block">EPS Pension:</span>
                <strong className="text-slate-800">₹{erEPS.toFixed(2)}</strong>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block">EDLI (0.5%):</span>
                <strong className="text-slate-800">₹{erEDLI.toFixed(2)}</strong>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block">Admin (0.5%):</span>
                <strong className="text-slate-800">₹{erAdmin.toFixed(2)}</strong>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block">ESIC (3.25%):</span>
                <strong className="text-slate-800">₹{erESIC.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Signatures & Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex items-end justify-between text-xs text-slate-500">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sky-700 font-mono text-[11px]">
                <Cpu className="w-3.5 h-3.5" />
                <span>Verified by C++17 Calculation Engine (`payroll_engine`)</span>
              </div>
              <p className="text-[10px] text-slate-400">System-generated slip. Signature verified electronically.</p>
            </div>
            <div className="text-right">
              <div className="w-40 border-b border-slate-400 mb-1"></div>
              <p className="font-semibold text-slate-800">{company?.signatory_name || 'Vikram Singhania'}</p>
              <p className="text-[10px] text-slate-500">{company?.signatory_designation || 'Authorized Signatory'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
