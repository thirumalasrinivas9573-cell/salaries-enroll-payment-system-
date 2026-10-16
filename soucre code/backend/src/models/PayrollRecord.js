const mongoose = require('mongoose');

const payrollRecordSchema = new mongoose.Schema(
  {
    payroll_run: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollRun',
      required: true,
      index: true
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    month: {
      type: Number,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    calendar_days: {
      type: Number,
      default: 30
    },
    paid_days: {
      type: Number,
      default: 0
    },
    ncp_days: {
      type: Number,
      default: 0
    },
    // Earnings Components
    earnings: {
      earned_basic: { type: Number, default: 0 },
      earned_da: { type: Number, default: 0 },
      earned_hra: { type: Number, default: 0 },
      earned_conveyance: { type: Number, default: 0 },
      earned_medical: { type: Number, default: 0 },
      earned_special: { type: Number, default: 0 },
      earned_other: { type: Number, default: 0 },
      overtime_hours: { type: Number, default: 0 },
      overtime_pay: { type: Number, default: 0 },
      gross_earned: { type: Number, default: 0 }
    },
    // Configured statutory wage bases
    wage_bases: {
      pf_wage_base: { type: Number, default: 0 },
      esic_wage_base: { type: Number, default: 0 }
    },
    // Employee Deductions
    deductions: {
      epf_employee: { type: Number, default: 0 },
      esic_employee: { type: Number, default: 0 },
      professional_tax: { type: Number, default: 0 },
      advance_deducted: { type: Number, default: 0 },
      other_deductions: { type: Number, default: 0 },
      income_tax_tds: { type: Number, default: 0 },
      total_deductions: { type: Number, default: 0 }
    },
    // Employer Contributions
    employer_costs: {
      employer_epf: { type: Number, default: 0 },
      employer_eps: { type: Number, default: 0 },
      employer_edli: { type: Number, default: 0 },
      employer_admin: { type: Number, default: 0 },
      employer_esic: { type: Number, default: 0 },
      total_employer_statutory: { type: Number, default: 0 },
      total_ctc: { type: Number, default: 0 }
    },
    net_payable: {
      type: Number,
      required: true,
      default: 0
    },
    epf_breakdown: {
      type: mongoose.Schema.Types.Mixed
    },
    esic_breakdown: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

payrollRecordSchema.index({ payroll_run: 1, employee: 1 }, { unique: true });

// Virtuals for legacy flattened response compatibility
payrollRecordSchema.virtual('gross_earned').get(function () {
  return this.earnings?.gross_earned || 0;
});
payrollRecordSchema.virtual('epf_employee').get(function () {
  return this.deductions?.epf_employee || 0;
});
payrollRecordSchema.virtual('esic_employee').get(function () {
  return this.deductions?.esic_employee || 0;
});
payrollRecordSchema.virtual('advance_deducted').get(function () {
  return this.deductions?.advance_deducted || 0;
});
payrollRecordSchema.virtual('other_deductions').get(function () {
  return this.deductions?.other_deductions || 0;
});
payrollRecordSchema.virtual('total_deductions').get(function () {
  return this.deductions?.total_deductions || 0;
});

payrollRecordSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.run_id = ret.payroll_run ? ret.payroll_run.toString() : null;
    ret.employee_id = ret.employee ? ret.employee.toString() : null;
    return ret;
  }
});

module.exports = mongoose.model('PayrollRecord', payrollRecordSchema);
