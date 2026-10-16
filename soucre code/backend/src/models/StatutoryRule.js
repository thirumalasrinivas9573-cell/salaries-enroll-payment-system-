const mongoose = require('mongoose');

const statutoryRuleSchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
      unique: true,
      default: 'v2026.1'
    },
    effective_from: {
      type: Date,
      default: () => new Date('2026-04-01')
    },
    pf_wage_ceiling: {
      type: Number,
      required: true,
      default: 15000.0
    },
    esic_wage_ceiling: {
      type: Number,
      required: true,
      default: 21000.0
    },
    pf_employee_rate: {
      type: Number,
      default: 12.0
    },
    pf_employer_rate: {
      type: Number,
      default: 3.67
    },
    eps_rate: {
      type: Number,
      default: 8.33
    },
    edli_rate: {
      type: Number,
      default: 0.50
    },
    admin_rate: {
      type: Number,
      default: 0.50
    },
    esic_employee_rate: {
      type: Number,
      default: 0.75
    },
    esic_employer_rate: {
      type: Number,
      default: 3.25
    },
    restrict_pf_ceiling: {
      type: Boolean,
      default: true
    },
    verified: {
      type: Boolean,
      default: true
    },
    verified_by: {
      type: String,
      default: 'Statutory Compliance Committee'
    },
    verified_at: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      default: 'Standard statutory configuration compliant with EPFO & ESIC circulars for FY 2026-27.'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('StatutoryRule', statutoryRuleSchema);
