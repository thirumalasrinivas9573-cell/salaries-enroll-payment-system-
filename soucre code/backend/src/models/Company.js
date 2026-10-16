const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: 'Apex Industrial Technologies Pvt Ltd'
    },
    registration_number: {
      type: String,
      default: 'U29100DL2018PTC334512'
    },
    address: {
      type: String,
      default: 'Plot 42, Sector 8, Industrial Area, Phase II, New Delhi 110020'
    },
    pf_code: {
      type: String,
      default: 'DL/CPM/0012345/000'
    },
    esic_code: {
      type: String,
      default: '11000123450000101'
    },
    pan: {
      type: String,
      default: 'AABCA1234C'
    },
    tan: {
      type: String,
      default: 'DELA12345B'
    },
    signatory_name: {
      type: String,
      default: 'Vikram Singhania'
    },
    signatory_designation: {
      type: String,
      default: 'Director & Authorized Signatory'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Company', companySchema);
