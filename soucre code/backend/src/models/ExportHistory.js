const mongoose = require('mongoose');

const exportHistorySchema = new mongoose.Schema(
  {
    payroll_run: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollRun',
      index: true
    },
    export_type: {
      type: String,
      enum: ['EPFO_ECR', 'ESIC_EXCEL', 'ESIC_CSV', 'BANK_NEFT'],
      required: true
    },
    file_name: {
      type: String,
      required: true
    },
    file_format: {
      type: String,
      required: true
    },
    month: {
      type: Number,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    total_records: {
      type: Number,
      default: 0
    },
    included_records: {
      type: Number,
      default: 0
    },
    excluded_records: {
      type: Number,
      default: 0
    },
    total_wages: {
      type: Number,
      default: 0
    },
    total_contributions: {
      type: Number,
      default: 0
    },
    validation_summary: {
      type: mongoose.Schema.Types.Mixed
    },
    download_url: {
      type: String
    },
    generated_by: {
      type: String,
      default: 'Authorized Compliance Officer'
    },
    generated_at: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

exportHistorySchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.run_id = ret.payroll_run ? ret.payroll_run.toString() : null;
    return ret;
  }
});

module.exports = mongoose.model('ExportHistory', exportHistorySchema);
