const { Employee, Attendance, AuditLog } = require('../models');

/**
 * Returns attendance and wage entry records for all active employees for given month & year.
 */
async function getMonthlyAttendance(req, res) {
  try {
    const month = parseInt(req.query.month) || 10;
    const year = parseInt(req.query.year) || 2026;

    if (month < 1 || month > 12) {
      return res.status(400).json({ success: false, error: 'Invalid month. Must be between 1 and 12.' });
    }
    if (year < 2000 || year > 2100) {
      return res.status(400).json({ success: false, error: 'Invalid year.' });
    }

    const calendarDays = new Date(year, month, 0).getDate();

    // Fetch active employees
    const employees = await Employee.find({ active: true }).sort({ emp_code: 1 });
    if (employees.length === 0) {
      return res.json({ success: true, month, year, calendarDays, data: [] });
    }

    const employeeIds = employees.map(e => e._id);
    const existingAttendances = await Attendance.find({
      employee: { $in: employeeIds },
      month,
      year
    });

    const attMap = {};
    existingAttendances.forEach(a => {
      attMap[a.employee.toString()] = a;
    });

    const result = employees.map(emp => {
      const existing = attMap[emp._id.toString()];
      const sal = emp.salary_structure || {};
      const empIdStr = emp._id.toString();

      return {
        employee_id: empIdStr,
        emp_code: emp.emp_code,
        full_name: emp.full_name,
        designation: emp.designation,
        department: emp.department,
        joining_date: emp.joining_date,
        active: emp.active,
        uan: emp.uan || '',
        esic_ip: emp.esic_ip || '',
        basic_wage: sal.basic_wage || 0,
        dearness_allowance: sal.dearness_allowance || 0,
        house_rent_allowance: sal.house_rent_allowance || 0,
        conveyance_allowance: sal.conveyance_allowance || 0,
        medical_allowance: sal.medical_allowance || 0,
        special_allowance: sal.special_allowance || 0,
        other_allowance: sal.other_allowance || 0,
        monthly_gross: sal.monthly_gross || 0,

        // Attendance fields
        calendar_days: existing ? existing.calendar_days : calendarDays,
        present_days: existing ? existing.present_days : Math.min(26, calendarDays - 4),
        paid_leaves: existing ? existing.paid_leaves : 0,
        weekly_offs: existing ? existing.weekly_offs : 4,
        absent_days: existing ? existing.absent_days : 0,
        ncp_days: existing ? existing.ncp_days : 0,
        overtime_hours: existing ? existing.overtime_hours : 0,
        overtime_amount: existing ? existing.overtime_amount : 0,
        advance_deduction: existing ? existing.advance_deduction : 0,
        other_deductions: existing ? existing.other_deductions : 0,
        pf_wage_base: existing ? existing.pf_wage_base : 0,
        esic_wage_base: existing ? existing.esic_wage_base : 0,
        remarks: existing ? existing.remarks || '' : '',
        attendance_id: existing ? existing._id.toString() : null
      };
    });

    res.json({ success: true, month, year, calendarDays, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Validates attendance and wage inputs, ensuring positive values and that
 * total paid days do not exceed calendar days, then updates Attendance collection.
 */
async function saveMonthlyAttendance(req, res) {
  try {
    const { month, year, records } = req.body;

    const m = parseInt(month);
    const y = parseInt(year);
    if (!m || m < 1 || m > 12) {
      return res.status(400).json({ success: false, error: 'Invalid payroll month (must be 1–12).' });
    }
    if (!y || y < 2000 || y > 2100) {
      return res.status(400).json({ success: false, error: 'Invalid payroll year.' });
    }
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'No attendance records provided in request payload.' });
    }

    const defaultMonthDays = new Date(y, m, 0).getDate();

    // Validate all records before writing
    const errors = [];
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const empLabel = r.emp_code ? `${r.emp_code} (${r.full_name || 'Staff'})` : `Record #${i + 1}`;

      if (!r.employee_id) {
        errors.push(`Missing employee ID for ${empLabel}.`);
        continue;
      }

      const calDays = parseInt(r.calendar_days) || defaultMonthDays;
      if (calDays < 28 || calDays > 31) {
        errors.push(`${empLabel}: Calendar days must be between 28 and 31 (received: ${calDays}).`);
      }

      const present = parseFloat(r.present_days) || 0;
      const leaves = parseFloat(r.paid_leaves) || 0;
      const offDays = parseFloat(r.weekly_offs) || 0;
      const otHours = parseFloat(r.overtime_hours) || 0;
      const otAmount = parseFloat(r.overtime_amount) || 0;
      const advance = parseFloat(r.advance_deduction) || 0;
      const otherDed = parseFloat(r.other_deductions) || 0;
      const pfWage = parseFloat(r.pf_wage_base) || 0;
      const esicWage = parseFloat(r.esic_wage_base) || 0;

      // Negative values validation
      if (present < 0 || leaves < 0 || offDays < 0 || otHours < 0 || otAmount < 0 || advance < 0 || otherDed < 0 || pfWage < 0 || esicWage < 0) {
        errors.push(`${empLabel}: Negative numbers are prohibited in attendance, overtime, or deduction fields.`);
      }

      // Attendance totals validation: present + paid_leaves + weekly_offs <= calendar_days
      const totalPaid = present + leaves + offDays;
      if (totalPaid > calDays) {
        errors.push(
          `${empLabel}: Total paid days (${totalPaid}) [Present: ${present} + Leaves: ${leaves} + Offs: ${offDays}] exceeds month calendar days (${calDays}).`
        );
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: errors.join(' | ')
      });
    }

    // Persist validated records to MongoDB
    for (const r of records) {
      const calDays = parseInt(r.calendar_days) || defaultMonthDays;
      const present = parseFloat(r.present_days) || 0;
      const leaves = parseFloat(r.paid_leaves) || 0;
      const offDays = parseFloat(r.weekly_offs) || 0;
      const absent = calDays - (present + leaves + offDays);
      const ncp = r.ncp_days !== undefined ? parseFloat(r.ncp_days) : Math.max(0, absent);

      await Attendance.findOneAndUpdate(
        { employee: r.employee_id, month: m, year: y },
        {
          employee: r.employee_id,
          month: m,
          year: y,
          calendar_days: calDays,
          present_days: present,
          paid_leaves: leaves,
          weekly_offs: offDays,
          absent_days: Math.max(0, absent),
          ncp_days: Math.max(0, ncp),
          overtime_hours: parseFloat(r.overtime_hours) || 0,
          overtime_amount: parseFloat(r.overtime_amount) || 0,
          advance_deduction: parseFloat(r.advance_deduction) || 0,
          other_deductions: parseFloat(r.other_deductions) || 0,
          pf_wage_base: parseFloat(r.pf_wage_base) || 0,
          esic_wage_base: parseFloat(r.esic_wage_base) || 0,
          remarks: r.remarks ? String(r.remarks).trim() : ''
        },
        { upsert: true, new: true }
      );
    }

    await AuditLog.create({
      action: 'ATTENDANCE_SAVE',
      entity: 'Attendance',
      user_name: req.user?.name || 'Administrator',
      details: { month: m, year: y, recordsCount: records.length }
    }).catch(() => {});

    res.json({
      success: true,
      message: `Monthly attendance and wage inputs for ${m}/${y} saved successfully (${records.length} records).`,
      count: records.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getMonthlyAttendance,
  saveMonthlyAttendance
};
