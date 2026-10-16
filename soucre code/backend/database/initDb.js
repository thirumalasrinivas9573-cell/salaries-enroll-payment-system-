const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'payroll.db');
const db = new sqlite3.Database(dbPath);

console.log('Initializing SQLite database at:', dbPath);

db.serialize(() => {
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON;');

  // 1. Companies Master
  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      establishment_id TEXT,
      pf_code TEXT,
      esic_code TEXT,
      pan TEXT,
      tan TEXT,
      address TEXT,
      signatory_name TEXT,
      signatory_designation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Employees Master
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      emp_code TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      gender TEXT DEFAULT 'Male',
      dob DATE,
      joining_date DATE,
      designation TEXT,
      department TEXT,
      phone TEXT,
      email TEXT,
      bank_name TEXT,
      bank_account TEXT,
      ifsc TEXT,
      pan TEXT,
      aadhaar TEXT,
      uan TEXT,
      esic_ip TEXT,
      pf_opt_out INTEGER DEFAULT 0,
      esic_opt_out INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Salary Structures
  db.run(`
    CREATE TABLE IF NOT EXISTS salary_structures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER UNIQUE NOT NULL,
      basic_wage REAL DEFAULT 0,
      dearness_allowance REAL DEFAULT 0,
      house_rent_allowance REAL DEFAULT 0,
      conveyance_allowance REAL DEFAULT 0,
      medical_allowance REAL DEFAULT 0,
      special_allowance REAL DEFAULT 0,
      other_allowance REAL DEFAULT 0,
      monthly_gross REAL DEFAULT 0,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );
  `);

  // 4. Employee Documents
  db.run(`
    CREATE TABLE IF NOT EXISTS employee_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      doc_type TEXT NOT NULL,
      doc_number TEXT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );
  `);

  // 5. Monthly Attendance & Wage Entry
  db.run(`
    CREATE TABLE IF NOT EXISTS monthly_attendances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      calendar_days INTEGER DEFAULT 30,
      present_days REAL DEFAULT 26,
      paid_leaves REAL DEFAULT 0,
      weekly_offs REAL DEFAULT 4,
      absent_days REAL DEFAULT 0,
      ncp_days REAL DEFAULT 0,
      overtime_hours REAL DEFAULT 0,
      advance_deduction REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, month, year),
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );
  `);

  // 6. Payroll Processing Runs (Batches)
  db.run(`
    CREATE TABLE IF NOT EXISTS payroll_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      status TEXT DEFAULT 'Draft',
      total_employees INTEGER DEFAULT 0,
      total_gross REAL DEFAULT 0,
      total_net REAL DEFAULT 0,
      total_pf_liability REAL DEFAULT 0,
      total_esic_liability REAL DEFAULT 0,
      processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(month, year)
    );
  `);

  // 7. Processed Payroll Records (Individual Slips)
  db.run(`
    CREATE TABLE IF NOT EXISTS payroll_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      calendar_days INTEGER,
      paid_days REAL,
      ncp_days REAL,
      earned_basic REAL,
      earned_da REAL,
      earned_hra REAL,
      earned_conveyance REAL,
      earned_medical REAL,
      earned_special REAL,
      overtime_pay REAL,
      gross_earned REAL,
      epf_employee REAL,
      esic_employee REAL,
      professional_tax REAL,
      advance_deducted REAL,
      income_tax_tds REAL,
      total_deductions REAL,
      net_payable REAL,
      employer_epf REAL,
      employer_eps REAL,
      employer_edli REAL,
      employer_admin REAL,
      employer_esic REAL,
      total_ctc REAL,
      epf_breakdown_json TEXT,
      esic_breakdown_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );
  `);

  // 8. Statutory Rules & Configuration
  db.run(`
    CREATE TABLE IF NOT EXISTS statutory_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pf_wage_ceiling REAL DEFAULT 15000.0,
      restrict_pf_ceiling INTEGER DEFAULT 1,
      pf_ee_rate REAL DEFAULT 12.0,
      eps_er_rate REAL DEFAULT 8.33,
      eps_ceiling_amount REAL DEFAULT 1250.0,
      edli_rate REAL DEFAULT 0.5,
      admin_rate REAL DEFAULT 0.5,
      esic_wage_ceiling REAL DEFAULT 21000.0,
      esic_ee_rate REAL DEFAULT 0.75,
      esic_er_rate REAL DEFAULT 3.25,
      esic_min_daily_exempt REAL DEFAULT 176.0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default Company
  db.get('SELECT COUNT(*) as count FROM companies', (err, row) => {
    if (!err && row.count === 0) {
      db.run(`
        INSERT INTO companies (name, establishment_id, pf_code, esic_code, pan, tan, address, signatory_name, signatory_designation)
        VALUES (
          'Apex Industrial Technologies Pvt Ltd',
          'DLCPM1982736000',
          'DL/CPM/1982736',
          '11000876540001001',
          'AAACA9876Q',
          'DELA12345B',
          'Plot 42, Okhla Industrial Area Phase-III, New Delhi, 110020',
          'Vikram Singhania',
          'Managing Director'
        )
      `);
      console.log('✓ Seeded default company profile');
    }
  });

  // Seed default Statutory Rules
  db.get('SELECT COUNT(*) as count FROM statutory_rules', (err, row) => {
    if (!err && row.count === 0) {
      db.run(`
        INSERT INTO statutory_rules (
          pf_wage_ceiling, restrict_pf_ceiling, pf_ee_rate, eps_er_rate, eps_ceiling_amount,
          edli_rate, admin_rate, esic_wage_ceiling, esic_ee_rate, esic_er_rate, esic_min_daily_exempt
        ) VALUES (
          15000.0, 1, 12.0, 8.33, 1250.0, 0.5, 0.5, 21000.0, 0.75, 3.25, 176.0
        )
      `);
      console.log('✓ Seeded default statutory rules');
    }
  });

  // Seed initial realistic workers (covering both under & over PF/ESIC ceilings, different departments)
  db.get('SELECT COUNT(*) as count FROM employees', (err, row) => {
    if (!err && row.count === 0) {
      const sampleWorkers = [
        {
          code: 'EMP001', name: 'Ramesh Kumar Verma', gender: 'Male', desig: 'Senior CNC Machine Operator', dept: 'Production',
          phone: '9811223344', email: 'ramesh.verma@apexind.com', bank: 'State Bank of India', acc: '30291827364', ifsc: 'SBIN0001234',
          pan: 'ABCDE1234F', aadhaar: '987654321098', uan: '101234567890', esic: '2012345678',
          basic: 12000, da: 2000, hra: 3000, conveyance: 1000, med: 500, special: 500
        },
        {
          code: 'EMP002', name: 'Sunita Devi', gender: 'Female', desig: 'Assembly Line Associate', dept: 'Production',
          phone: '9822334455', email: 'sunita.devi@apexind.com', bank: 'Punjab National Bank', acc: '49281726354', ifsc: 'PUNB0123400',
          pan: 'BCDEF2345G', aadhaar: '876543210987', uan: '101234567891', esic: '2012345679',
          basic: 9500, da: 1500, hra: 2500, conveyance: 800, med: 500, special: 200
        },
        {
          code: 'EMP003', name: 'Amitabh Sharma', gender: 'Male', desig: 'Quality Assurance Supervisor', dept: 'Quality',
          phone: '9833445566', email: 'amitabh.qa@apexind.com', bank: 'HDFC Bank', acc: '501002938475', ifsc: 'HDFC0000123',
          pan: 'CDEFG3456H', aadhaar: '765432109876', uan: '101234567892', esic: '', // Gross > 21k, ESIC exempt
          basic: 22000, da: 4000, hra: 8000, conveyance: 2000, med: 1000, special: 3000
        },
        {
          code: 'EMP004', name: 'Mohammed Imran', gender: 'Male', desig: 'Maintenance Technician', dept: 'Maintenance',
          phone: '9844556677', email: 'imran.tech@apexind.com', bank: 'Bank of Baroda', acc: '18273645281', ifsc: 'BARB0OKHLAX',
          pan: 'DEFGH4567I', aadhaar: '654321098765', uan: '101234567893', esic: '2012345681',
          basic: 11000, da: 2000, hra: 2800, conveyance: 1000, med: 500, special: 700
        },
        {
          code: 'EMP005', name: 'Pooja Rani', gender: 'Female', desig: 'Stores & Inventory Assistant', dept: 'Logistics',
          phone: '9855667788', email: 'pooja.stores@apexind.com', bank: 'ICICI Bank', acc: '002938471625', ifsc: 'ICIC0000045',
          pan: 'EFGHI5678J', aadhaar: '543210987654', uan: '101234567894', esic: '2012345682',
          basic: 10500, da: 1800, hra: 2500, conveyance: 1000, med: 500, special: 700
        },
        {
          code: 'EMP006', name: 'Rajeshwar Yadav', gender: 'Male', desig: 'Packaging & Warehouse Helper', dept: 'Warehouse',
          phone: '9866778899', email: 'rajeshwar@apexind.com', bank: 'State Bank of India', acc: '20192837465', ifsc: 'SBIN0001234',
          pan: 'FGHIJ6789K', aadhaar: '432109876543', uan: '101234567895', esic: '2012345683',
          basic: 8500, da: 1500, hra: 2000, conveyance: 500, med: 300, special: 200
        }
      ];

      sampleWorkers.forEach(w => {
        db.run(`
          INSERT INTO employees (
            emp_code, full_name, gender, dob, joining_date, designation, department,
            phone, email, bank_name, bank_account, ifsc, pan, aadhaar, uan, esic_ip
          ) VALUES (?, ?, ?, '1990-05-15', '2022-01-10', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          w.code, w.name, w.gender, w.desig, w.dept,
          w.phone, w.email, w.bank, w.acc, w.ifsc, w.pan, w.aadhaar, w.uan, w.esic
        ], function(err) {
          if (!err) {
            const empId = this.lastID;
            const gross = w.basic + w.da + w.hra + w.conveyance + w.med + w.special;
            db.run(`
              INSERT INTO salary_structures (
                employee_id, basic_wage, dearness_allowance, house_rent_allowance,
                conveyance_allowance, medical_allowance, special_allowance, other_allowance, monthly_gross
              ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
            `, [empId, w.basic, w.da, w.hra, w.conveyance, w.med, w.special, gross]);

            // Seed default attendance for current month (October 2026)
            db.run(`
              INSERT INTO monthly_attendances (
                employee_id, month, year, calendar_days, present_days, paid_leaves, weekly_offs, absent_days, ncp_days, overtime_hours, advance_deduction
              ) VALUES (?, 10, 2026, 30, 26, 0, 4, 0, 0, ?, ?)
            `, [empId, (w.code === 'EMP001' ? 8 : (w.code === 'EMP004' ? 4 : 0)), (w.code === 'EMP002' ? 500 : 0)]);
          }
        });
      });
      console.log('✓ Seeded initial employees, salary packages, and attendance');
    }
  });
});

module.exports = db;
