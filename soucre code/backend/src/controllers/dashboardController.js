const { Employee, PayrollRun, ExportHistory } = require('../models');

async function getDashboardStats(req, res) {
  try {
    const month = parseInt(req.query.month) || 10;
    const year = parseInt(req.query.year) || 2026;

    // 1. Employee master aggregates (REAL MongoDB counts)
    const [totalEmployees, activeEmployees, pfEmployees, esicEmployees] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ active: true }),
      Employee.countDocuments({ active: true, pf_opt_out: { $ne: true } }),
      Employee.countDocuments({ active: true, esic_opt_out: { $ne: true } })
    ]);

    // 2. Selected period payroll run (REAL MongoDB query)
    const run = await PayrollRun.findOne({ month, year }).sort({ revision_number: -1 });

    // 3. Validation errors / warnings from real employee data
    const activeEmpList = await Employee.find({ active: true });
    const pendingValidationErrors = [];

    activeEmpList.forEach(emp => {
      const uan = emp.uan ? String(emp.uan).trim() : '';
      const esicIp = emp.esic_ip ? String(emp.esic_ip).trim() : '';
      const gross = emp.salary_structure?.monthly_gross || 0;

      if (!emp.pf_opt_out && (!uan || !/^\d{12}$/.test(uan))) {
        pendingValidationErrors.push({
          type: 'warning',
          emp_code: emp.emp_code,
          full_name: emp.full_name,
          issue: `Missing or invalid 12-digit UAN ('${uan || 'BLANK'}'). Mandatory for EPFO ECR filing.`
        });
      }

      if (!emp.esic_opt_out && gross <= 21000 && (!esicIp || !/^\d{10}$|^\d{17}$/.test(esicIp))) {
        pendingValidationErrors.push({
          type: 'warning',
          emp_code: emp.emp_code,
          full_name: emp.full_name,
          issue: `Gross ₹${gross} is covered under ESIC, but 10-digit IP number is missing or invalid.`
        });
      }
    });

    // 4. Recent payroll runs & export history
    const [recentRuns, recentExports] = await Promise.all([
      PayrollRun.find().sort({ year: -1, month: -1, revision_number: -1 }).limit(5),
      ExportHistory.find().sort({ generated_at: -1 }).limit(5)
    ]);

    // Construct response strictly reflecting actual database state
    const responseData = {
      period: {
        month,
        year
      },
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        withPF: pfEmployees,
        withESIC: esicEmployees
      },
      payroll: {
        status: run ? run.status : 'Not Processed',
        runId: run ? run._id.toString() : null,
        revisionNumber: run ? run.revision_number : 0,
        totalGross: run ? run.total_gross : 0,
        totalNet: run ? run.total_net : 0,
        totalEmployeeDeductions: run ? run.total_employee_deductions : 0,
        totalEmployerContributions: run ? run.total_employer_contributions : 0,
        totalPFLiability: run ? run.total_pf_liability : 0,
        totalESICLiability: run ? run.total_esic_liability : 0,
        processedAt: run ? run.processed_at : null,
        finalizedAt: run ? run.finalized_at : null
      },
      pendingValidationErrors,
      recentRuns: recentRuns.map(r => r.toJSON()),
      recentExports: recentExports.map(e => e.toJSON())
    };

    res.json({ success: true, data: responseData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getDashboardStats
};
