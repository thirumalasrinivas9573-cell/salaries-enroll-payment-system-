const mongoose = require('mongoose');
const { Employee, Attendance, StatutoryRule, PayrollRun, PayrollRecord, Company, AuditLog } = require('../models');
const { runCppEngine } = require('../services/cppEngineBridge');

/**
 * Prepares calculation payload for the C++17 OOP engine.
 */
async function preparePayload(month, year) {
  const m = parseInt(month);
  const y = parseInt(year);

  // 1. Fetch active statutory rules configuration
  let rules = await StatutoryRule.findOne().sort({ createdAt: -1 });
  if (!rules) {
    rules = {
      version: 'v2026.1',
      pf_wage_ceiling: 15000.0,
      esic_wage_ceiling: 21000.0,
      restrict_pf_ceiling: true,
      verified: true
    };
  }

  // 2. Calendar days in month
  const defaultMonthDays = new Date(y, m, 0).getDate();

  // 3. Fetch active employees and their attendance records
  const employees = await Employee.find({ active: true }).sort({ emp_code: 1 });
  if (employees.length === 0) {
    return {
      month: m,
      year: y,
      pfCeiling: rules.pf_wage_ceiling,
      esicCeiling: rules.esic_wage_ceiling,
      restrictPfCeiling: rules.restrict_pf_ceiling,
      ruleVersion: rules.version,
      rulesSnapshot: rules,
      items: []
    };
  }

  const employeeIds = employees.map(e => e._id);
  const attendances = await Attendance.find({
    employee: { $in: employeeIds },
    month: m,
    year: y
  });
  const attMap = {};
  attendances.forEach(a => {
    attMap[a.employee.toString()] = a;
  });

  const items = employees.map(emp => {
    const sal = emp.salary_structure || {};
    const att = attMap[emp._id.toString()];

    const calendarDays = att ? att.calendar_days : defaultMonthDays;
    const presentDays = att ? att.present_days : Math.min(26, calendarDays - 4);
    const paidLeaves = att ? att.paid_leaves : 0;
    const weeklyOffs = att ? att.weekly_offs : 4;
    const absentDays = att ? att.absent_days : Math.max(0, calendarDays - (presentDays + paidLeaves + weeklyOffs));
    const ncpDays = att ? att.ncp_days : absentDays;

    return {
      id: emp._id.toString(),
      empCode: emp.emp_code,
      fullName: emp.full_name,
      designation: emp.designation || 'Staff',
      department: emp.department || 'Operations',
      bankName: emp.bank_name || '',
      bankAccount: emp.bank_account || '',
      ifsc: emp.ifsc || '',
      pan: emp.pan || '',
      uan: emp.uan || '',
      esicIp: emp.esic_ip || '',
      pfOptOut: Boolean(emp.pf_opt_out),
      esicOptOut: Boolean(emp.esic_opt_out),
      active: Boolean(emp.active),
      joiningDate: emp.joining_date ? emp.joining_date.toISOString().split('T')[0] : '',

      // Salary Structure
      basicWage: sal.basic_wage || 0,
      dearnessAllowance: sal.dearness_allowance || 0,
      houseRentAllowance: sal.house_rent_allowance || 0,
      conveyanceAllowance: sal.conveyance_allowance || 0,
      medicalAllowance: sal.medical_allowance || 0,
      specialAllowance: sal.special_allowance || 0,
      otherAllowance: sal.other_allowance || 0,

      // Attendance & Working Days
      calendarDays,
      presentDays,
      paidLeaves,
      weeklyOffs,
      absentDays,
      ncpDays,

      // Overtime & Deductions
      overtimeHours: att ? att.overtime_hours : 0,
      overtimeAmount: att ? att.overtime_amount : 0,
      advanceDeduction: att ? att.advance_deduction : 0,
      otherDeductions: att ? att.other_deductions : 0,

      // Configured statutory wage bases (distinct from gross)
      pfWageBase: att ? att.pf_wage_base : 0,
      esicWageBase: att ? att.esic_wage_base : 0
    };
  });

  return {
    month: m,
    year: y,
    pfCeiling: Number(rules.pf_wage_ceiling) || 15000.0,
    esicCeiling: Number(rules.esic_wage_ceiling) || 21000.0,
    restrictPfCeiling: Boolean(rules.restrict_pf_ceiling),
    ruleVersion: rules.version || 'v2026.1',
    rulesSnapshot: rules.toObject ? rules.toObject() : rules,
    items
  };
}

/**
 * Live calculation preview (triggers C++ engine without saving to DB).
 */
async function previewPayroll(req, res) {
  try {
    const month = parseInt(req.body.month || req.query.month) || 10;
    const year = parseInt(req.body.year || req.query.year) || 2026;

    if (month < 1 || month > 12) {
      return res.status(400).json({ success: false, error: 'Invalid payroll month (1–12).' });
    }
    if (year < 2000 || year > 2100) {
      return res.status(400).json({ success: false, error: 'Invalid payroll year.' });
    }

    const payload = await preparePayload(month, year);
    if (!payload.items || payload.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: `No active employees found to process for ${month}/${year}. Please register employees in Employee Master first.`
      });
    }

    // Check if an existing run exists for this period
    const existingRun = await PayrollRun.findOne({ month, year }).sort({ revision_number: -1 });

    // Run C++ Calculation Engine
    const result = await runCppEngine(payload);

    // Re-attach MongoDB employee ObjectIds to preview slips
    const allEmployees = await Employee.find({}, '_id emp_code');
    const codeToIdMap = {};
    allEmployees.forEach(emp => { codeToIdMap[emp.emp_code] = emp._id.toString(); });
    if (result.slips && Array.isArray(result.slips)) {
      result.slips.forEach(slip => {
        if (slip.employee && codeToIdMap[slip.employee.empCode]) {
          slip.employee.id = codeToIdMap[slip.employee.empCode];
        }
      });
    }

    res.json({
      success: true,
      month,
      year,
      existingRun: existingRun ? existingRun.toJSON() : null,
      rules: {
        version: payload.ruleVersion,
        verified: Boolean(payload.rulesSnapshot.verified),
        verifiedBy: payload.rulesSnapshot.verified_by,
        pfCeiling: payload.pfCeiling,
        esicCeiling: payload.esicCeiling
      },
      ...result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Saves payroll run as a Draft.
 */
async function saveDraftPayroll(req, res) {
  try {
    const month = parseInt(req.body.month) || 10;
    const year = parseInt(req.body.year) || 2026;

    // Check if a Finalized run already exists for this period
    const finalizedRun = await PayrollRun.findOne({ month, year, status: 'Finalized' });
    if (finalizedRun) {
      return res.status(400).json({
        success: false,
        error: `A Finalized payroll run already exists for ${month}/${year} (Run #${finalizedRun._id}). Cannot overwrite a finalized payroll as draft.`
      });
    }

    const payload = await preparePayload(month, year);
    if (!payload.items || payload.items.length === 0) {
      return res.status(400).json({ success: false, error: 'No active employees to process.' });
    }

    const result = await runCppEngine(payload);
    const summary = result.summary;

    let payrollRun = await PayrollRun.findOne({ month, year });
    if (payrollRun) {
      payrollRun.status = 'Draft';
      payrollRun.rule_version = payload.ruleVersion;
      payrollRun.rule_snapshot = payload.rulesSnapshot;
      payrollRun.total_employees = summary.totalEmployees;
      payrollRun.total_gross = summary.totalGrossEarned;
      payrollRun.total_net = summary.totalNetPayable;
      payrollRun.total_employee_deductions = summary.totalEmployeeDeductions;
      payrollRun.total_employer_contributions = summary.totalEmployerContributions;
      payrollRun.total_pf_liability = summary.totalPFLiability;
      payrollRun.total_esic_liability = summary.totalESICLiability;
      payrollRun.processed_at = new Date();
      await payrollRun.save();
    } else {
      payrollRun = await PayrollRun.create({
        month,
        year,
        status: 'Draft',
        rule_version: payload.ruleVersion,
        rule_snapshot: payload.rulesSnapshot,
        total_employees: summary.totalEmployees,
        total_gross: summary.totalGrossEarned,
        total_net: summary.totalNetPayable,
        total_employee_deductions: summary.totalEmployeeDeductions,
        total_employer_contributions: summary.totalEmployerContributions,
        total_pf_liability: summary.totalPFLiability,
        total_esic_liability: summary.totalESICLiability,
        processed_at: new Date()
      });
    }

    // Replace individual draft slips
    await PayrollRecord.deleteMany({ payroll_run: payrollRun._id });
    await insertPayrollRecords(payrollRun._id, month, year, result.slips);

    res.json({
      success: true,
      message: `Payroll draft for ${month}/${year} saved successfully. You can review and finalize when ready.`,
      status: 'Draft',
      runId: payrollRun._id.toString(),
      summary
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Finalizes and locks a payroll run.
 */
async function processAndSavePayroll(req, res) {
  try {
    const month = parseInt(req.body.month) || 10;
    const year = parseInt(req.body.year) || 2026;
    const isRevision = Boolean(req.body.isRevision);
    const revisionReason = req.body.revisionReason ? String(req.body.revisionReason).trim() : '';

    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return res.status(400).json({ success: false, error: 'Invalid payroll period.' });
    }

    // 1. Fetch active statutory rules
    const rules = await StatutoryRule.findOne().sort({ createdAt: -1 });
    if (!rules || !rules.verified) {
      return res.status(400).json({
        success: false,
        error: `Statutory compliance rules (${rules?.version || 'Unknown'}) must be marked as verified before payroll can be finalized.`
      });
    }

    // 2. Safety Check: Duplicate finalized payroll run check
    const existingRun = await PayrollRun.findOne({ month, year }).sort({ revision_number: -1 });

    let nextRevision = 1;
    if (existingRun && existingRun.status === 'Finalized') {
      if (!isRevision) {
        return res.status(409).json({
          success: false,
          isAlreadyFinalized: true,
          error: `A finalized payroll run already exists for ${month}/${year} (Run #${existingRun._id}, Revision ${existingRun.revision_number || 1}). Finalized payroll cannot be silently overwritten. To create an authorized correction, provide an auditable revision reason.`
        });
      }

      if (!revisionReason) {
        return res.status(400).json({
          success: false,
          error: 'An auditable revision reason is required to revise a finalized payroll run (e.g. "Overtime adjustment for shopfloor team").'
        });
      }

      nextRevision = (existingRun.revision_number || 1) + 1;
    }

    // 3. Assemble inputs and compute via C++ engine
    const payload = await preparePayload(month, year);
    if (!payload.items || payload.items.length === 0) {
      return res.status(400).json({ success: false, error: 'No active employees to process.' });
    }

    const result = await runCppEngine(payload);
    const summary = result.summary;

    const operatorName = req.user ? req.user.name : 'Authorized Compliance Officer';
    const now = new Date();

    let payrollRun;
    if (existingRun) {
      existingRun.status = 'Finalized';
      existingRun.rule_version = payload.ruleVersion;
      existingRun.rule_snapshot = rules.toObject ? rules.toObject() : rules;
      existingRun.revision_number = nextRevision;
      existingRun.revision_reason = revisionReason || null;
      existingRun.total_employees = summary.totalEmployees;
      existingRun.total_gross = summary.totalGrossEarned;
      existingRun.total_net = summary.totalNetPayable;
      existingRun.total_employee_deductions = summary.totalEmployeeDeductions;
      existingRun.total_employer_contributions = summary.totalEmployerContributions;
      existingRun.total_pf_liability = summary.totalPFLiability;
      existingRun.total_esic_liability = summary.totalESICLiability;
      existingRun.processed_at = now;
      existingRun.finalized_at = now;
      existingRun.finalized_by = operatorName;
      await existingRun.save();
      payrollRun = existingRun;
    } else {
      payrollRun = await PayrollRun.create({
        month,
        year,
        status: 'Finalized',
        rule_version: payload.ruleVersion,
        rule_snapshot: rules.toObject ? rules.toObject() : rules,
        revision_number: 1,
        revision_reason: null,
        total_employees: summary.totalEmployees,
        total_gross: summary.totalGrossEarned,
        total_net: summary.totalNetPayable,
        total_employee_deductions: summary.totalEmployeeDeductions,
        total_employer_contributions: summary.totalEmployerContributions,
        total_pf_liability: summary.totalPFLiability,
        total_esic_liability: summary.totalESICLiability,
        processed_at: now,
        finalized_at: now,
        finalized_by: operatorName
      });
    }

    // Replace individual slips
    await PayrollRecord.deleteMany({ payroll_run: payrollRun._id });
    await insertPayrollRecords(payrollRun._id, month, year, result.slips);

    await AuditLog.create({
      action: 'PAYROLL_FINALIZE',
      entity: 'PayrollRun',
      entity_id: payrollRun._id.toString(),
      user_name: operatorName,
      details: { month, year, revision: nextRevision, reason: revisionReason }
    }).catch(() => {});

    res.json({
      success: true,
      message: isRevision
        ? `Payroll Revision #${nextRevision} finalized and locked for ${month}/${year} with audit trail.`
        : `Payroll for ${month}/${year} finalized and locked successfully.`,
      runId: payrollRun._id.toString(),
      status: 'Finalized',
      revisionNumber: nextRevision,
      ruleVersion: payload.ruleVersion,
      summary,
      engine: result.engine,
      data: {
        runId: payrollRun._id.toString(),
        status: 'Finalized',
        revision_number: nextRevision,
        revision_reason: revisionReason || null,
        rule_version: payload.ruleVersion
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Helper to insert individual employee payslip records into PayrollRecord collection.
 */
async function insertPayrollRecords(runId, month, year, slips) {
  const allEmployees = await Employee.find({}, '_id emp_code');
  const codeToIdMap = {};
  allEmployees.forEach(emp => {
    codeToIdMap[emp.emp_code] = emp._id;
  });

  const recordsToInsert = slips.map(slip => {
    const e = slip.employee;
    const att = slip.attendance;
    const earn = slip.earnings;
    const ded = slip.deductions;
    const costs = slip.employerCosts;
    const bases = slip.wageBases || {};

    const employeeId = codeToIdMap[e.empCode] || (mongoose.Types.ObjectId.isValid(e.id) ? e.id : null);
    if (!employeeId) {
      throw new Error(`Cannot match employee code ${e.empCode || e.id} to a database employee record.`);
    }

    return {
      payroll_run: runId,
      employee: employeeId,
      month,
      year,
      calendar_days: att.calendarDays,
      paid_days: att.paidDays,
      ncp_days: att.ncpDays,

      earnings: {
        earned_basic: earn.earnedBasic,
        earned_da: earn.earnedDA,
        earned_hra: earn.earnedHRA,
        earned_conveyance: earn.earnedConveyance,
        earned_medical: earn.earnedMedical,
        earned_special: earn.earnedSpecial,
        earned_other: earn.earnedOther || 0,
        overtime_hours: earn.overtimeHours || att.overtimeHours || 0,
        overtime_pay: earn.overtimePay,
        gross_earned: earn.grossEarned
      },

      wage_bases: {
        pf_wage_base: bases.pfWageBase || 0,
        esic_wage_base: bases.esicWageBase || 0
      },

      deductions: {
        epf_employee: ded.epfEmployee,
        esic_employee: ded.esicEmployee,
        professional_tax: ded.professionalTax,
        advance_deducted: ded.advanceDeducted,
        other_deductions: ded.otherDeductions || 0,
        income_tax_tds: ded.incomeTaxTDS,
        total_deductions: ded.totalDeductions
      },

      employer_costs: {
        employer_epf: costs.employerEPF,
        employer_eps: costs.employerEPS,
        employer_edli: costs.employerEDLI,
        employer_admin: costs.employerAdmin,
        employer_esic: costs.employerESIC,
        total_employer_statutory: costs.totalEmployerStatutory,
        total_ctc: costs.totalCTC
      },

      net_payable: slip.netPayable,
      epf_breakdown: slip.epfBreakdown,
      esic_breakdown: slip.esicBreakdown
    };
  });

  if (recordsToInsert.length > 0) {
    await PayrollRecord.insertMany(recordsToInsert);
  }
}

/**
 * Returns all past payroll runs.
 */
async function getPayrollRuns(req, res) {
  try {
    const runs = await PayrollRun.find().sort({ year: -1, month: -1, revision_number: -1 });
    res.json({ success: true, data: runs.map(r => r.toJSON()) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Returns full details and employee payslips for a specific payroll run.
 */
async function getRunDetails(req, res) {
  try {
    const { id } = req.params;
    const run = await PayrollRun.findById(id);
    if (!run) {
      return res.status(404).json({ success: false, error: 'Payroll run not found' });
    }

    const records = await PayrollRecord.find({ payroll_run: id }).populate('employee');

    // Flatten for UI display
    const slips = records.map(r => {
      const emp = r.employee || {};
      const earn = r.earnings || {};
      const ded = r.deductions || {};
      const costs = r.employer_costs || {};
      const bases = r.wage_bases || {};

      return {
        id: r._id.toString(),
        run_id: id,
        employee_id: emp._id ? emp._id.toString() : r.employee.toString(),
        emp_code: emp.emp_code || '',
        full_name: emp.full_name || '',
        designation: emp.designation || '',
        department: emp.department || '',
        bank_name: emp.bank_name || '',
        bank_account: emp.bank_account || '',
        ifsc: emp.ifsc || '',
        pan: emp.pan || '',
        uan: emp.uan || '',
        esic_ip: emp.esic_ip || '',
        calendar_days: r.calendar_days,
        paid_days: r.paid_days,
        ncp_days: r.ncp_days,

        earned_basic: earn.earned_basic || 0,
        earned_da: earn.earned_da || 0,
        earned_hra: earn.earned_hra || 0,
        earned_conveyance: earn.earned_conveyance || 0,
        earned_medical: earn.earned_medical || 0,
        earned_special: earn.earned_special || 0,
        earned_other: earn.earned_other || 0,
        overtime_hours: earn.overtime_hours || 0,
        overtime_pay: earn.overtime_pay || 0,
        gross_earned: earn.gross_earned || 0,

        pf_wage_base: bases.pf_wage_base || 0,
        esic_wage_base: bases.esic_wage_base || 0,

        epf_employee: ded.epf_employee || 0,
        esic_employee: ded.esic_employee || 0,
        professional_tax: ded.professional_tax || 0,
        advance_deducted: ded.advance_deducted || 0,
        other_deductions: ded.other_deductions || 0,
        income_tax_tds: ded.income_tax_tds || 0,
        total_deductions: ded.total_deductions || 0,
        net_payable: r.net_payable,

        employer_epf: costs.employer_epf || 0,
        employer_eps: costs.employer_eps || 0,
        employer_edli: costs.employer_edli || 0,
        employer_admin: costs.employer_admin || 0,
        employer_esic: costs.employer_esic || 0,
        total_employer_statutory: costs.total_employer_statutory || 0,
        total_ctc: costs.total_ctc || 0,

        epf_breakdown: r.epf_breakdown,
        esic_breakdown: r.esic_breakdown
      };
    });

    res.json({ success: true, run: run.toJSON(), slips });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Returns single payslip with company profile for printing / download.
 */
async function getSinglePayslip(req, res) {
  try {
    const { recordId } = req.params;
    const record = await PayrollRecord.findById(recordId).populate('employee');

    if (!record) {
      return res.status(404).json({ success: false, error: 'Payslip record not found' });
    }

    const company = await Company.findOne();
    const emp = record.employee || {};
    const earn = record.earnings || {};
    const ded = record.deductions || {};
    const costs = record.employer_costs || {};

    const slip = {
      id: record._id.toString(),
      month: record.month,
      year: record.year,
      calendar_days: record.calendar_days,
      paid_days: record.paid_days,
      ncp_days: record.ncp_days,

      emp_code: emp.emp_code,
      full_name: emp.full_name,
      designation: emp.designation,
      department: emp.department,
      bank_name: emp.bank_name,
      bank_account: emp.bank_account,
      ifsc: emp.ifsc,
      pan: emp.pan,
      uan: emp.uan,
      esic_ip: emp.esic_ip,

      earned_basic: earn.earned_basic || 0,
      earned_da: earn.earned_da || 0,
      earned_hra: earn.earned_hra || 0,
      earned_conveyance: earn.earned_conveyance || 0,
      earned_medical: earn.earned_medical || 0,
      earned_special: earn.earned_special || 0,
      earned_other: earn.earned_other || 0,
      overtime_hours: earn.overtime_hours || 0,
      overtime_pay: earn.overtime_pay || 0,
      gross_earned: earn.gross_earned || 0,

      epf_employee: ded.epf_employee || 0,
      esic_employee: ded.esic_employee || 0,
      professional_tax: ded.professional_tax || 0,
      advance_deducted: ded.advance_deducted || 0,
      other_deductions: ded.other_deductions || 0,
      income_tax_tds: ded.income_tax_tds || 0,
      total_deductions: ded.total_deductions || 0,
      net_payable: record.net_payable,

      employer_epf: costs.employer_epf || 0,
      employer_eps: costs.employer_eps || 0,
      employer_edli: costs.employer_edli || 0,
      employer_admin: costs.employer_admin || 0,
      employer_esic: costs.employer_esic || 0,
      total_employer_statutory: costs.total_employer_statutory || 0,
      total_ctc: costs.total_ctc || 0,

      company_name: company?.name || 'Apex Industrial Technologies Pvt Ltd',
      company_address: company?.address || '',
      pf_code: company?.pf_code || '',
      esic_code: company?.esic_code || '',
      company_pan: company?.pan || '',
      signatory_name: company?.signatory_name || '',
      signatory_designation: company?.signatory_designation || ''
    };

    res.json({ success: true, slip });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  previewPayroll,
  saveDraftPayroll,
  processAndSavePayroll,
  getPayrollRuns,
  getRunDetails,
  getSinglePayslip
};
