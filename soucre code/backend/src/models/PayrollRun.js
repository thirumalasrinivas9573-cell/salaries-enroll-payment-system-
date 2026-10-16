const mongoose = require('mongoose');

const payrollRunSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100
    },
    status: {
      type: String,
      enum: ['Draft', 'Finalized'],
      default: 'Draft',
      index: true
    },
    revision_number: {
      type: Number,
      default: 1
    },
    revision_reason: {
      type: String,
      trim: true
    },
    rule_version: {
      type: String,
      default: 'v2026.1'
    },
    rule_snapshot: {
      type: mongoose.Schema.Types.Mixed
    },
    total_employees: {
      type: Number,
      default: 0
    },
    total_gross: {
      type: Number,
      default: 0
    },
    total_net: {
      type: Number,
      default: 0
    },
    total_employee_deductions: {
      type: Number,
      default: 0
    },
    total_employer_contributions: {
      type: Number,
      default: 0
    },
    total_pf_liability: {
      type: Number,
      default: 0
    },
    total_esic_liability: {
      type: Number,
      default: 0
    },
    processed_at: {
      type: Date,
      default: Date.now
    },
    finalized_at: {
      type: Date
    },
    finalized_by: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

payrollRunSchema.index({ month: 1, year: 1, revision_number: 1 });

payrollRunSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    return ret;
  }
});

module.exports = mongoose.model('PayrollRun', payrollRunSchema);
