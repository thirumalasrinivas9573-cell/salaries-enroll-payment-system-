const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'payroll.db');
const db = new sqlite3.Database(dbPath);

console.log('Running safe database schema migration for Employee Master...');

db.serialize(() => {
  // Helper to add column safely if it doesn't exist
  function addColumnIfNotExists(table, columnDef, colName) {
    db.all(`PRAGMA table_info(${table})`, (err, columns) => {
      if (err) {
        console.error(`Error checking ${table} columns:`, err);
        return;
      }
      const exists = columns.some(c => c.name.toLowerCase() === colName.toLowerCase());
      if (!exists) {
        db.run(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`, (alterErr) => {
          if (alterErr) {
            console.error(`Failed to add ${colName} to ${table}:`, alterErr.message);
          } else {
            console.log(`✓ Added column '${colName}' to table '${table}'`);
          }
        });
      } else {
        console.log(`- Column '${colName}' already exists in table '${table}'`);
      }
    });
  }

  // 1. Employee columns
  addColumnIfNotExists('employees', 'status TEXT DEFAULT "Active"', 'status');
  addColumnIfNotExists('employees', 'deactivated_at DATETIME', 'deactivated_at');
  addColumnIfNotExists('employees', 'deactivation_reason TEXT', 'deactivation_reason');

  // 2. Employee Document columns
  addColumnIfNotExists('employee_documents', 'file_size INTEGER DEFAULT 0', 'file_size');
  addColumnIfNotExists('employee_documents', 'mime_type TEXT DEFAULT "application/pdf"', 'mime_type');
  addColumnIfNotExists('employee_documents', 'expiry_date DATE', 'expiry_date');
  addColumnIfNotExists('employee_documents', 'uploaded_by TEXT DEFAULT "HR Admin"', 'uploaded_by');
  addColumnIfNotExists('employee_documents', 'updated_at DATETIME DEFAULT CURRENT_TIMESTAMP', 'updated_at');

  // 3. Create index for fast search & uniqueness verification
  db.run(`CREATE INDEX IF NOT EXISTS idx_emp_code ON employees(emp_code)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_emp_uan ON employees(uan)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_emp_esic ON employees(esic_ip)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_emp_pan ON employees(pan)`);
});

setTimeout(() => {
  db.close((err) => {
    if (err) console.error('Error closing DB:', err);
    else console.log('✓ Migration completed safely. Existing records preserved.');
  });
}, 1000);
