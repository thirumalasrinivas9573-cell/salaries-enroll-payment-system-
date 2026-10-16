const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema(
  {
    basic_wage: { type: Number, default: 0, min: 0 },
    dearness_allowance: { type: Number, default: 0, min: 0 },
    house_rent_allowance: { type: Number, default: 0, min: 0 },
    conveyance_allowance: { type: Number, default: 0, min: 0 },
    medical_allowance: { type: Number, default: 0, min: 0 },
    special_allowance: { type: Number, default: 0, min: 0 },
    other_allowance: { type: Number, default: 0, min: 0 },
    monthly_gross: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    emp_code: {
      type: String,
      required: [true, 'Employee code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    full_name: {
      type: String,
      required: [true, 'Full legal employee name is required'],
      trim: true,
      index: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male'
    },
    dob: {
      type: Date
    },
    joining_date: {
      type: Date,
      default: Date.now
    },
    exit_date: {
      type: Date
    },
    designation: {
      type: String,
      trim: true,
      default: 'Staff'
    },
    department: {
      type: String,
      trim: true,
      default: 'Operations',
      index: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    bank_name: {
      type: String,
      trim: true
    },
    bank_account: {
      type: String,
      trim: true
    },
    ifsc: {
      type: String,
      trim: true,
      uppercase: true
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true
    },
    aadhaar: {
      type: String,
      trim: true
    },
    uan: {
      type: String,
      trim: true,
      index: true
    },
    esic_ip: {
      type: String,
      trim: true,
      index: true
    },
    pf_opt_out: {
      type: Boolean,
      default: false
    },
    esic_opt_out: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Resigned', 'Terminated'],
      default: 'Active'
    },
    salary_structure: {
      type: salaryStructureSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

// Virtual for formatted salary fields for legacy compatibility
employeeSchema.virtual('basic_wage').get(function () {
  return this.salary_structure?.basic_wage || 0;
});
employeeSchema.virtual('monthly_gross').get(function () {
  return this.salary_structure?.monthly_gross || 0;
});

// Configure JSON serialization to include virtuals and id
employeeSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    return ret;
  }
});

module.exports = mongoose.model('Employee', employeeSchema);
