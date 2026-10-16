const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
const { PayrollRun, PayrollRecord, Employee, ExportHistory, AuditLog } = require('../models');

/**
 * Validates payroll records for EPFO ECR 2.0 readiness before export.
 */
async function validatePFECR(req, res) {
  try {
    const { runId, month, year } = req.query;
    let run;
    if (runId && mongoose.Types.ObjectId.isValid(runId)) {
      run = await PayrollRun.findById(runId);
    } else if (month && year) {
      run = await PayrollRun.findOne({ month: parseInt(month), year: parseInt(year) }).sort({ revision_number: -1 });
    }

    if (!run) {
      return res.status(404).json({ success: false, error: 'No payroll run found for selected period.' });
    }

    if (run.status !== 'Finalized') {
      return res.status(400).json({
        success: false,
        isDraft: true,
        error: `Payroll run for ${run.month}/${run.year} is in '${run.status}' status. ECR generation is permitted only for finalized and locked runs.`
      });
    }

    const records = await PayrollRecord.find({ payroll_run: run._id }).populate('employee');

    const validRecords = [];
    const excludedRecords = [];
    const warnings = [];

    let totalGross = 0;
    let totalEpfWages = 0;
    let totalEpsWages = 0;
    let totalEdliWages = 0;
    let totalEeShare = 0;
    let totalEpsShare = 0;
    let totalErShare = 0;

    for (const r of records) {
      const emp = r.employee || {};
      const gross = Math.round(r.earnings?.gross_earned || 0);
      const epfWage = Math.round(r.wage_bases?.pf_wage_base > 0 ? r.wage_bases.pf_wage_base : Math.min(gross, 15000));
      const eeShare = Math.round(r.deductions?.epf_employee || 0);

      // Exclusion Check 1: Explicit opt-out
      if (emp.pf_opt_out) {
        excludedRecords.push({
          emp_code: emp.emp_code,
          full_name: emp.full_name,
          reason: 'Employee opted out of Provident Fund coverage (pf_opt_out = true).'
        });
        continue;
      }

      // Exclusion Check 2: Missing or invalid UAN
      const uan = emp.uan ? String(emp.uan).trim() : '';
      if (!uan || !/^\d{12}$/.test(uan)) {
        excludedRecords.push({
          emp_code: emp.emp_code,
          full_name: emp.full_name,
          reason: `Missing or invalid 12-digit UAN ('${uan || 'BLANK'}'). Mandatory for EPFO ECR 2.0 filing.`
        });
        continue;
      }

      // Senior citizen / EPS Age Check
      let isEpsExempt = false;
      if (emp.dob) {
        const age = new Date().getFullYear() - new Date(emp.dob).getFullYear();
        if (age >= 58) {
          isEpsExempt = true;
          warnings.push(`${emp.emp_code} (${emp.full_name}) is ${age} years old (>=58). EPS contribution set to 0.`);
        }
      }

      const epsWage = isEpsExempt ? 0 : Math.min(epfWage, 15000);
      const edliWage = Math.min(epfWage, 15000);
      const epsShare = isEpsExempt ? 0 : Math.round(r.employer_costs?.employer_eps || Math.round(epsWage * 0.0833));
      const erShare = Math.max(0, eeShare - epsShare);
      const ncpDays = Math.round(r.ncp_days || 0);

      validRecords.push({
        uan,
        name: emp.full_name.trim(),
        gross,
        epfWage,
        epsWage,
        edliWage,
        eeShare,
        epsShare,
        erShare,
        ncpDays,
        refund: 0
      });

      totalGross += gross;
      totalEpfWages += epfWage;
      totalEpsWages += epsWage;
      totalEdliWages += edliWage;
      totalEeShare += eeShare;
      totalEpsShare += epsShare;
      totalErShare += erShare;
    }

    res.json({
      success: true,
      month: run.month,
      year: run.year,
      runId: run._id.toString(),
      status: run.status,
      summary: {
        totalRecords: records.length,
        validCount: validRecords.length,
        excludedCount: excludedRecords.length,
        totalGross,
        totalEpfWages,
        totalEpsWages,
        totalEdliWages,
        totalEeShare,
        totalEpsShare,
        totalErShare,
        totalRemittance: totalEeShare + totalEpsShare + totalErShare
      },
      validRecords,
      excludedRecords,
      warnings
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Generates and downloads the official EPFO ECR 2.0 text file (#~# delimited).
 */
async function exportPFECR(req, res) {
  try {
    const { runId, month, year } = req.query;
    let run;
    if (runId && mongoose.Types.ObjectId.isValid(runId)) {
      run = await PayrollRun.findById(runId);
    } else if (month && year) {
      run = await PayrollRun.findOne({ month: parseInt(month), year: parseInt(year) }).sort({ revision_number: -1 });
    }

    if (!run) {
      return res.status(404).json({ success: false, error: 'Payroll run not found' });
    }

    if (run.status !== 'Finalized') {
      return res.status(400).json({
        error: `Payroll run for ${run.month}/${run.year} is currently in '${run.status}' status. EPFO ECR generation is only permitted for finalized and locked payroll runs.`
      });
    }

    const records = await PayrollRecord.find({ payroll_run: run._id }).populate('employee');

    let totalWages = 0;
    let totalContributions = 0;
    let includedCount = 0;
    let excludedCount = 0;
    const lines = [];

    for (const r of records) {
      const emp = r.employee || {};
      const uan = emp.uan ? String(emp.uan).trim() : '';

      // Skip opt-outs or missing UAN
      if (emp.pf_opt_out || !uan || !/^\d{12}$/.test(uan)) {
        excludedCount++;
        continue;
      }

      const gross = Math.round(r.earnings?.gross_earned || 0);
      const epfWage = Math.round(r.wage_bases?.pf_wage_base > 0 ? r.wage_bases.pf_wage_base : Math.min(gross, 15000));
      const eeShare = Math.round(r.deductions?.epf_employee || 0);

      let isEpsExempt = false;
      if (emp.dob) {
        const age = new Date().getFullYear() - new Date(emp.dob).getFullYear();
        if (age >= 58) isEpsExempt = true;
      }

      const epsWage = isEpsExempt ? 0 : Math.min(epfWage, 15000);
      const edliWage = Math.min(epfWage, 15000);
      const epsShare = isEpsExempt ? 0 : Math.round(r.employer_costs?.employer_eps || Math.round(epsWage * 0.0833));
      const erShare = Math.max(0, eeShare - epsShare);
      const ncpDays = Math.round(r.ncp_days || 0);

      // Format strictly matching EPFO ECR 2.0:
      // UAN#~#MemberName#~#Gross#~#EPFWage#~#EPSWage#~#EDLIWage#~#EEShare#~#EPSShare#~#ERDiff#~#NCPDays#~#Refund
      const line = [
        uan,
        emp.full_name.trim(),
        gross,
        epfWage,
        epsWage,
        edliWage,
        eeShare,
        epsShare,
        erShare,
        ncpDays,
        0
      ].join('#~#');

      lines.push(line);
      includedCount++;
      totalWages += epfWage;
      totalContributions += (eeShare + epsShare + erShare);
    }

    const fileName = `EPFO_ECR_2.0_${run.month}_${run.year}.txt`;
    const ecrContent = lines.join('\n');

    // Audit log in ExportHistory
    await ExportHistory.create({
      payroll_run: run._id,
      export_type: 'EPFO_ECR',
      file_name: fileName,
      file_format: 'TXT',
      month: run.month,
      year: run.year,
      total_records: records.length,
      included_records: includedCount,
      excluded_records: excludedCount,
      total_wages: totalWages,
      total_contributions: totalContributions,
      validation_summary: {
        validCount: includedCount,
        excludedCount: excludedCount,
        format: 'EPFO ECR 2.0 #~#'
      },
      generated_by: req.user?.name || 'Compliance Officer',
      generated_at: new Date()
    }).catch(() => {});

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(ecrContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Validates ESIC monthly contribution records before Excel generation.
 */
async function validateESICExcel(req, res) {
  try {
    const { runId, month, year } = req.query;
    let run;
    if (runId && mongoose.Types.ObjectId.isValid(runId)) {
      run = await PayrollRun.findById(runId);
    } else if (month && year) {
      run = await PayrollRun.findOne({ month: parseInt(month), year: parseInt(year) }).sort({ revision_number: -1 });
    }

    if (!run) {
      return res.status(404).json({ success: false, error: 'Payroll run not found' });
    }

    if (run.status !== 'Finalized') {
      return res.status(400).json({
        success: false,
        isDraft: true,
        error: `Payroll run for ${run.month}/${run.year} is in '${run.status}' status. ESIC Excel generation is permitted only for finalized and locked runs.`
      });
    }

    const records = await PayrollRecord.find({ payroll_run: run._id }).populate('employee');

    const validRecords = [];
    const excludedRecords = [];

    let totalWages = 0;
    let totalEeContribution = 0;
    let totalErContribution = 0;

    for (const r of records) {
      const emp = r.employee || {};
      const gross = Math.round(r.earnings?.gross_earned || 0);
      const paidDays = Math.round(r.paid_days || 0);

      // Check 1: Explicit opt-out
      if (emp.esic_opt_out) {
        excludedRecords.push({
          emp_code: emp.emp_code,
          full_name: emp.full_name,
          reason: 'Employee opted out of ESIC scheme (esic_opt_out = true).'
        });
        continue;
      }

      // Check 2: Missing or invalid IP Number
      const ipNumber = emp.esic_ip ? String(emp.esic_ip).trim() : '';
      if (!ipNumber || !/^\d{10}$|^\d{17}$/.test(ipNumber)) {
        excludedRecords.push({
          emp_code: emp.emp_code,
          full_name: emp.full_name,
          reason: `Missing or non-conforming ESIC Insurance Person (IP) number ('${ipNumber || 'BLANK'}').`
        });
        continue;
      }

      // Reason Code logic for zero working days
      let reasonCode = 0;
      let lastWorkingDay = '';
      if (paidDays === 0) {
        if (gross > 21000) {
          reasonCode = 1; // Out of coverage
        } else if (emp.status === 'Resigned' || emp.status === 'Terminated' || emp.exit_date) {
          reasonCode = 2; // Left service
          if (emp.exit_date) {
            const d = new Date(emp.exit_date);
            lastWorkingDay = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
          }
        } else {
          reasonCode = 9; // Loss of pay / Unpaid leave
        }
      }

      const eeContrib = Math.round(r.deductions?.esic_employee || 0);
      const erContrib = Math.round(r.employer_costs?.employer_esic || Math.ceil(gross * 0.0325));

      validRecords.push({
        ipNumber,
        ipName: emp.full_name.trim(),
        paidDays,
        monthlyWages: gross,
        reasonCode,
        lastWorkingDay,
        eeContrib,
        erContrib
      });

      totalWages += gross;
      totalEeContribution += eeContrib;
      totalErContribution += erContrib;
    }

    res.json({
      success: true,
      month: run.month,
      year: run.year,
      runId: run._id.toString(),
      status: run.status,
      summary: {
        totalEmployees: records.length,
        validCount: validRecords.length,
        excludedCount: excludedRecords.length,
        totalWages,
        totalEeContribution,
        totalErContribution,
        totalChallan: totalEeContribution + totalErContribution
      },
      validRecords,
      excludedRecords
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Generates and downloads the official ESIC Employer Monthly Contribution Excel workbook (.xlsx).
 */
async function exportESICExcel(req, res) {
  try {
    const { runId, month, year } = req.query;
    let run;
    if (runId && mongoose.Types.ObjectId.isValid(runId)) {
      run = await PayrollRun.findById(runId);
    } else if (month && year) {
      run = await PayrollRun.findOne({ month: parseInt(month), year: parseInt(year) }).sort({ revision_number: -1 });
    }

    if (!run) {
      return res.status(404).json({ success: false, error: 'Payroll run not found' });
    }

    if (run.status !== 'Finalized') {
      return res.status(400).json({
        error: `Payroll run for ${run.month}/${run.year} is currently in '${run.status}' status. ESIC Excel generation is only permitted for finalized and locked payroll runs.`
      });
    }

    const records = await PayrollRecord.find({ payroll_run: run._id }).populate('employee');

    // Create authentic ExcelJS workbook matching official ESIC portal specs
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Salary Enroll Pay System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Monthly Contribution');

    // Define official 6 columns
    worksheet.columns = [
      { header: 'IP Number', key: 'ipNumber', width: 18 },
      { header: 'IP Name', key: 'ipName', width: 30 },
      { header: 'No of Days for which wages paid', key: 'paidDays', width: 32 },
      { header: 'Total Monthly Wages', key: 'monthlyWages', width: 22 },
      { header: 'Reason Code for Zero Working Days', key: 'reasonCode', width: 34 },
      { header: 'Last Working Day', key: 'lastWorkingDay', width: 20 }
    ];

    // Style Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F3854' } // Enterprise Navy
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    let includedCount = 0;
    let excludedCount = 0;
    let totalWages = 0;
    let totalContributions = 0;

    for (const r of records) {
      const emp = r.employee || {};
      const ip = emp.esic_ip ? String(emp.esic_ip).trim() : '';

      // Skip opt-outs or missing IP
      if (emp.esic_opt_out || !ip || !/^\d{10}$|^\d{17}$/.test(ip)) {
        excludedCount++;
        continue;
      }

      const gross = Math.round(r.earnings?.gross_earned || 0);
      const paidDays = Math.round(r.paid_days || 0);

      let reasonCode = 0;
      let lastWorkingDay = '';
      if (paidDays === 0) {
        if (gross > 21000) {
          reasonCode = 1;
        } else if (emp.status === 'Resigned' || emp.status === 'Terminated' || emp.exit_date) {
          reasonCode = 2;
          if (emp.exit_date) {
            const d = new Date(emp.exit_date);
            lastWorkingDay = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
          }
        } else {
          reasonCode = 9;
        }
      }

      const eeContrib = Math.round(r.deductions?.esic_employee || 0);
      const erContrib = Math.round(r.employer_costs?.employer_esic || Math.ceil(gross * 0.0325));

      const row = worksheet.addRow({
        ipNumber: ip,
        ipName: emp.full_name.trim(),
        paidDays,
        monthlyWages: gross,
        reasonCode,
        lastWorkingDay: lastWorkingDay || ''
      });

      row.alignment = { vertical: 'middle' };
      row.getCell('ipNumber').alignment = { horizontal: 'center' };
      row.getCell('paidDays').alignment = { horizontal: 'right' };
      row.getCell('monthlyWages').alignment = { horizontal: 'right' };
      row.getCell('reasonCode').alignment = { horizontal: 'center' };
      row.getCell('lastWorkingDay').alignment = { horizontal: 'center' };

      includedCount++;
      totalWages += gross;
      totalContributions += (eeContrib + erContrib);
    }

    const fileName = `ESIC_Monthly_Contribution_${run.month}_${run.year}.xlsx`;

    // Record in ExportHistory
    await ExportHistory.create({
      payroll_run: run._id,
      export_type: 'ESIC_EXCEL',
      file_name: fileName,
      file_format: 'XLSX',
      month: run.month,
      year: run.year,
      total_records: records.length,
      included_records: includedCount,
      excluded_records: excludedCount,
      total_wages: totalWages,
      total_contributions: totalContributions,
      validation_summary: {
        validCount: includedCount,
        excludedCount: excludedCount,
        format: 'Official ESIC Excel Template (.xlsx)'
      },
      generated_by: req.user?.name || 'Compliance Officer',
      generated_at: new Date()
    }).catch(() => {});

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Legacy ESIC CSV Exporter
 */
async function exportESICCSV(req, res) {
  try {
    const { runId, month, year } = req.query;
    let run;
    if (runId && mongoose.Types.ObjectId.isValid(runId)) {
      run = await PayrollRun.findById(runId);
    } else if (month && year) {
      run = await PayrollRun.findOne({ month: parseInt(month), year: parseInt(year) }).sort({ revision_number: -1 });
    }

    if (!run) {
      return res.status(404).json({ success: false, error: 'Payroll run not found' });
    }

    if (run.status !== 'Finalized') {
      return res.status(400).json({
        error: `Payroll run for ${run.month}/${run.year} is currently in '${run.status}' status.`
      });
    }

    const records = await PayrollRecord.find({ payroll_run: run._id }).populate('employee');

    const headers = ['IP Number,IP Name,No of Days for which wages paid,Total Monthly Wages,Reason Code for Zero Working Days,Last Working Day'];
    const lines = [...headers];

    for (const r of records) {
      const emp = r.employee || {};
      const ip = emp.esic_ip ? String(emp.esic_ip).trim() : '';
      if (emp.esic_opt_out || !ip || !/^\d{10}$|^\d{17}$/.test(ip)) continue;

      const gross = Math.round(r.earnings?.gross_earned || 0);
      const paidDays = Math.round(r.paid_days || 0);
      let reasonCode = 0;
      let lastWorkingDay = '';
      if (paidDays === 0) {
        if (gross > 21000) reasonCode = 1;
        else if (emp.status === 'Resigned' || emp.status === 'Terminated' || emp.exit_date) {
          reasonCode = 2;
          if (emp.exit_date) {
            const d = new Date(emp.exit_date);
            lastWorkingDay = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
          }
        } else reasonCode = 9;
      }

      lines.push(`${ip},"${emp.full_name.trim()}",${paidDays},${gross},${reasonCode},${lastWorkingDay}`);
    }

    const fileName = `ESIC_Contribution_${run.month}_${run.year}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(lines.join('\n'));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Corporate Banking NEFT/RTGS CSV Payout file.
 */
async function exportBankNEFT(req, res) {
  try {
    const { runId, month, year } = req.query;
    let run;
    if (runId && mongoose.Types.ObjectId.isValid(runId)) {
      run = await PayrollRun.findById(runId);
    } else if (month && year) {
      run = await PayrollRun.findOne({ month: parseInt(month), year: parseInt(year) }).sort({ revision_number: -1 });
    }

    if (!run) {
      return res.status(404).json({ success: false, error: 'Payroll run not found' });
    }

    const records = await PayrollRecord.find({ payroll_run: run._id }).populate('employee');

    const headers = ['SrNo,EmployeeCode,BeneficiaryName,AccountNumber,IFSC,Amount,Narration'];
    const lines = [...headers];
    let sr = 1;

    for (const r of records) {
      const emp = r.employee || {};
      const net = Math.round(r.net_payable || 0);
      if (net <= 0) continue;

      lines.push(
        `${sr++},${emp.emp_code},"${emp.full_name.trim()}",${emp.bank_account || ''},${emp.ifsc || ''},${net},"Salary ${run.month}/${run.year}"`
      );
    }

    const fileName = `Bank_Disbursement_NEFT_${run.month}_${run.year}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(lines.join('\n'));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Returns audit trail history of all generated exports.
 */
async function getExportHistory(req, res) {
  try {
    const history = await ExportHistory.find().sort({ generated_at: -1 }).populate('payroll_run');
    res.json({
      success: true,
      data: history.map(h => ({
        ...h.toJSON(),
        run_status: h.payroll_run?.status || 'Finalized'
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  validatePFECR,
  exportPFECR,
  validateESICExcel,
  exportESICExcel,
  exportESICCSV,
  exportBankNEFT,
  getExportHistory
};
