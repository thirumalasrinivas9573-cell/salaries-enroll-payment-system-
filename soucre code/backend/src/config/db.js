const mongoose = require('mongoose');
const { User, Company, StatutoryRule } = require('../models');

let isDbConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in the backend environment (.env).');
    throw new Error('Database configuration missing: MONGODB_URI must be provided.');
  }

  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000
    });

    isDbConnected = true;
    console.log(`✓ MongoDB Connected Successfully!`);
    console.log(`  Host: ${conn.connection.host}`);
    console.log(`  Database: ${conn.connection.name}`);

    // Bootstrap initial essential system configurations (NO DEMO EMPLOYEES)
    await bootstrapSystemEssentials();

    return conn;
  } catch (err) {
    isDbConnected = false;
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    throw err;
  }
}

// Connection event listeners
mongoose.connection.on('disconnected', () => {
  isDbConnected = false;
  console.warn('⚠️  MongoDB disconnected. Attempting reconnection...');
});

mongoose.connection.on('reconnected', () => {
  isDbConnected = true;
  console.log('✓ MongoDB reconnected successfully.');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB runtime error:', err.message);
});

/**
 * Initializes essential administrative setup only if the database is brand new.
 * NOTE: NEVER seeds demo employees, attendance, or payroll records.
 */
async function bootstrapSystemEssentials() {
  try {
    // 1. Initial Admin User (if none exists)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('⚡ Initializing initial administrator credentials...');
      await User.create({
        email: 'admin@salaryenroll.com',
        password: 'Admin@12345',
        name: 'Enterprise Payroll Administrator',
        role: 'admin',
        department: 'Administration'
      });
      console.log('✓ Initial Admin created: admin@salaryenroll.com / Admin@12345');
    }

    // 2. Default Statutory Compliance Rules (if none exists)
    const ruleCount = await StatutoryRule.countDocuments();
    if (ruleCount === 0) {
      console.log('⚡ Initializing default verified statutory rules (v2026.1)...');
      await StatutoryRule.create({
        version: 'v2026.1',
        pf_wage_ceiling: 15000.0,
        esic_wage_ceiling: 21000.0,
        pf_employee_rate: 12.0,
        pf_employer_rate: 3.67,
        eps_rate: 8.33,
        edli_rate: 0.50,
        admin_rate: 0.50,
        esic_employee_rate: 0.75,
        esic_employer_rate: 3.25,
        restrict_pf_ceiling: true,
        verified: true,
        verified_by: 'Statutory Compliance Committee',
        notes: 'Official statutory rules for FY 2026-27'
      });
      console.log('✓ Statutory rules v2026.1 verified and saved.');
    }

    // 3. Default Organization Profile (if none exists)
    const companyCount = await Company.countDocuments();
    if (companyCount === 0) {
      console.log('⚡ Initializing organization profile...');
      await Company.create({
        name: 'Apex Industrial Technologies Pvt Ltd',
        registration_number: 'U29100DL2018PTC334512',
        address: 'Plot 42, Sector 8, Industrial Area, Phase II, New Delhi 110020',
        pf_code: 'DL/CPM/0012345/000',
        esic_code: '11000123450000101',
        pan: 'AABCA1234C',
        tan: 'DELA12345B',
        signatory_name: 'Vikram Singhania',
        signatory_designation: 'Director & Authorized Signatory'
      });
      console.log('✓ Organization profile saved.');
    }
  } catch (err) {
    console.error('Error during system bootstrap:', err.message);
  }
}

function checkDbConnection(req, res, next) {
  if (!isDbConnected && mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: 'Database is currently unavailable or disconnected. Please check MONGODB_URI and try again.'
    });
  }
  next();
}

module.exports = {
  connectDB,
  checkDbConnection,
  isDbConnected: () => isDbConnected || mongoose.connection.readyState === 1
};
