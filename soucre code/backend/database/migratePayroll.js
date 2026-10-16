const { db, dbAll, dbRun } = require('../src/config/db');

async function migratePayroll() {
  console.log('--- Starting Payroll & Attendance Schema Migration ---');

  // Helper to add column safely
  async function addColumnIfNotExists(table, column, colDef) {
    const cols = await dbAll(`PRAGMA table_info(${table})`);
    const exists = cols.some(c => c.name.toLowerCase() === column.toLowerCase());
    if (!exists) {
      console.log(`Adding column '${column}' to '${table}'...`);
      await dbRun(`ALTER TABLE ${table} ADD COLUMN ${column} ${colDef}`);
    } else {
      console.log(`Column '${column}' already exists in '${table}'.`);
    }
  }

  // 1. monthly_attendances
  await addColumnIfNotExists('monthly_attendances', 'overtime_amount', 'REAL DEFAULT 0');
  await addColumnIfNotExists('monthly_attendances', 'other_deductions', 'REAL DEFAULT 0');
  await addColumnIfNotExists('monthly_attendances', 'pf_wage_base', 'REAL DEFAULT 0');
  await addColumnIfNotExists('monthly_attendances', 'esic_wage_base', 'REAL DEFAULT 0');
  await addColumnIfNotExists('monthly_attendances', 'remarks', 'TEXT');
  await addColumnIfNotExists('monthly_attendances', 'updated_at', 'DATETIME');

  // 2. statutory_rules
  await addColumnIfNotExists('statutory_rules', 'version', "TEXT DEFAULT 'v2026.1'");
  await addColumnIfNotExists('statutory_rules', 'rule_name', "TEXT DEFAULT 'Statutory Compliance Rules 2026'");
  await addColumnIfNotExists('statutory_rules', 'effective_from', "TEXT DEFAULT '2024-04-01'");
  await addColumnIfNotExists('statutory_rules', 'verified', 'INTEGER DEFAULT 1');
  await addColumnIfNotExists('statutory_rules', 'verified_by', "TEXT DEFAULT 'Compliance Auditor'");
  await addColumnIfNotExists('statutory_rules', 'verified_at', 'TEXT');
  await addColumnIfNotExists('statutory_rules', 'pf_rounding', "TEXT DEFAULT 'NEAREST'");
  await addColumnIfNotExists('statutory_rules', 'esic_rounding', "TEXT DEFAULT 'CEIL'");

  // 3. payroll_runs
  await addColumnIfNotExists('payroll_runs', 'rule_version', "TEXT DEFAULT 'v2026.1'");
  await addColumnIfNotExists('payroll_runs', 'rule_snapshot_json', 'TEXT');
  await addColumnIfNotExists('payroll_runs', 'revision_number', 'INTEGER DEFAULT 1');
  await addColumnIfNotExists('payroll_runs', 'revision_reason', 'TEXT');
  await addColumnIfNotExists('payroll_runs', 'total_employee_deductions', 'REAL DEFAULT 0');
  await addColumnIfNotExists('payroll_runs', 'total_employer_contributions', 'REAL DEFAULT 0');
  await addColumnIfNotExists('payroll_runs', 'created_at', 'TEXT');
  await addColumnIfNotExists('payroll_runs', 'finalized_at', 'TEXT');
  await addColumnIfNotExists('payroll_runs', 'finalized_by', 'TEXT');

  // 4. payroll_records
  await addColumnIfNotExists('payroll_records', 'overtime_hours', 'REAL DEFAULT 0');
  await addColumnIfNotExists('payroll_records', 'earned_other', 'REAL DEFAULT 0');
  await addColumnIfNotExists('payroll_records', 'other_deductions', 'REAL DEFAULT 0');
  await addColumnIfNotExists('payroll_records', 'pf_wage_base', 'REAL DEFAULT 0');
  await addColumnIfNotExists('payroll_records', 'esic_wage_base', 'REAL DEFAULT 0');
  await addColumnIfNotExists('payroll_records', 'total_employer_statutory', 'REAL DEFAULT 0');

  // Update existing statutory rules with verified metadata if missing
  await dbRun(`
    UPDATE statutory_rules
    SET version = COALESCE(version, 'v2026.1'),
        rule_name = COALESCE(rule_name, 'Statutory Compliance Rules 2026'),
        verified = COALESCE(verified, 1),
        verified_by = COALESCE(verified_by, 'Compliance Auditor'),
        pf_rounding = COALESCE(pf_rounding, 'NEAREST'),
        esic_rounding = COALESCE(esic_rounding, 'CEIL')
    WHERE id = 1
  `);

  console.log('✓ Payroll & Attendance Schema Migration Completed Successfully.');
  process.exit(0);
}

migratePayroll().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
