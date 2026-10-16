const mongoose = require('mongoose');

const employeeDocumentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    doc_type: {
      type: String,
      required: true,
      default: 'General Document'
    },
    doc_number: {
      type: String,
      trim: true
    },
    file_name: {
      type: String,
      required: true
    },
    file_path: {
      type: String,
      required: true
    },
    file_size: {
      type: Number,
      required: true
    },
    mime_type: {
      type: String,
      required: true
    },
    expiry_date: {
      type: Date
    },
    uploaded_by: {
      type: String,
      default: 'Administrator'
    },
    verified: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

employeeDocumentSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.employee_id = ret.employee ? ret.employee.toString() : null;
    return ret;
  }
});

module.exports = mongoose.model('EmployeeDocument', employeeDocumentSchema);
