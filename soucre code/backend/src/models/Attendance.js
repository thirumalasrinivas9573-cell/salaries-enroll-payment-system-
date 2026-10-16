const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
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
    calendar_days: {
      type: Number,
      default: 30,
      min: 28,
      max: 31
    },
    present_days: {
      type: Number,
      default: 0,
      min: 0
    },
    paid_leaves: {
      type: Number,
      default: 0,
      min: 0
    },
    weekly_offs: {
      type: Number,
      default: 0,
      min: 0
    },
    absent_days: {
      type: Number,
      default: 0,
      min: 0
    },
    ncp_days: {
      type: Number,
      default: 0,
      min: 0
    },
    overtime_hours: {
      type: Number,
      default: 0,
      min: 0
    },
    overtime_amount: {
      type: Number,
      default: 0,
      min: 0
    },
    advance_deduction: {
      type: Number,
      default: 0,
      min: 0
    },
    other_deductions: {
      type: Number,
      default: 0,
      min: 0
    },
    pf_wage_base: {
      type: Number,
      default: 0,
      min: 0
    },
    esic_wage_base: {
      type: Number,
      default: 0,
      min: 0
    },
    remarks: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent accidental duplicate employee records for the same month/year
attendanceSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

attendanceSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.employee_id = ret.employee ? ret.employee.toString() : null;
    return ret;
  }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
