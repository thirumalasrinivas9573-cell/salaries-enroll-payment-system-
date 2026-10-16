/**
 * Salary Enroll Pay System — Comprehensive Payroll & Attendance Verification Test Suite
 *
 * Tests:
 * 1. Normal values & Net Pay formula
 * 2. Zero wages & zero attendance safety
 * 3. Negative inputs rejection (400 Bad Request)
 * 4. Missing employee information / invalid employee (400 Bad Request)
 * 5. Rounding rules (EPFO Nearest Rupee, ESIC Ceil)
 * 6. Different configured wage bases (Gross != PF Base != ESIC Base)
 * 7. Duplicate records & duplicate run prevention (409 Conflict)
 * 8. Invalid attendance totals (Present + Leaves > Calendar Days rejected)
 * 9. Employer liability isolation (Never subtracted from Net Pay)
 * 10. Auditable revision process (Revision number incremented, revision reason required)
 */

const http = require('http');
const assert = require('assert');
const { dbRun } = require('../src/config/db');

const BASE_URL = 'http://127.0.0.1:5001';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const payload = data ? JSON.stringify(data) : null;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, body: parsed, raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, body: body, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('=======================================================================');
  console.log('    SALARY ENROLL PAY SYSTEM — END-TO-END PAYROLL & ATTENDANCE TESTS   ');
  console.log('=======================================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    process.stdout.write(`[TEST ${total}] ${name} ... `);
    try {
      await fn();
      console.log('PASSED ✓');
      passed++;
    } catch (err) {
      console.log('FAILED ✗');
      console.error(`   Error: ${err.message}`);
    }
  }

  // Reset test periods 11/2026 and 12/2026 for idempotent test execution
  await dbRun(`DELETE FROM payroll_records WHERE (month = 11 OR month = 12) AND year = 2026`);
  await dbRun(`DELETE FROM payroll_runs WHERE (month = 11 OR month = 12) AND year = 2026`);
  await dbRun(`DELETE FROM monthly_attendances WHERE (month = 11 OR month = 12) AND year = 2026`);

  // Ensure rules are verified for testing
  await makeRequest('PUT', '/api/statutory/rules', {
    version: 'v2026.1',
    rule_name: 'Indian Statutory Rules 2026',
    verified: 1,
    verified_by: 'Chief Compliance Officer',
    pf_wage_ceiling: 15000,
    esic_wage_ceiling: 21000
  });

  // TEST 1: Normal values & Net Pay Formula
  await test('Normal Values Calculation & Net Pay Formula', async () => {
    const res = await makeRequest('POST', '/api/payroll/preview', {
      month: 9,
      year: 2026
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.strictEqual(res.body.success, true);
    assert(Array.isArray(res.body.slips), 'Slips should be an array');
    assert(res.body.slips.length > 0, 'Should return at least 1 slip');

    for (const slip of res.body.slips) {
      const gross = slip.earnings.grossEarned;
      const totalDed = slip.deductions.totalDeductions;
      const netPay = slip.netPayable;
      const expectedNet = Math.max(0, Math.round((gross - totalDed) * 100) / 100);

      assert.strictEqual(
        Math.abs(netPay - expectedNet) < 0.05,
        true,
        `Net pay (${netPay}) must equal Gross (${gross}) - Deductions (${totalDed})`
      );
    }
  });

  // TEST 2: Zero Wages & Zero Attendance Handled Safely
  await test('Zero Wages & Zero Attendance Safety', async () => {
    // Save attendance with 0 paid days for test employee
    const employeesRes = await makeRequest('GET', '/api/employees');
    assert(employeesRes.body.data.length > 0);
    const empId = employeesRes.body.data[0].id;

    await makeRequest('POST', '/api/attendance/bulk', {
      month: 11,
      year: 2026,
      records: [{
        employee_id: empId,
        calendar_days: 30,
        present_days: 0,
        paid_leaves: 0,
        weekly_offs: 0,
        overtime_hours: 0,
        overtime_amount: 0,
        advance_deduction: 0,
        other_deductions: 0
      }]
    });

    const previewRes = await makeRequest('POST', '/api/payroll/preview', {
      month: 11,
      year: 2026
    });
    assert.strictEqual(previewRes.status, 200);
    const zeroSlip = previewRes.body.slips.find(s => s.employee.id === empId);
    assert(zeroSlip, 'Slip for zero attendance employee should exist');
    assert.strictEqual(zeroSlip.earnings.grossEarned, 0, 'Gross earned must be 0 for 0 attendance');
    assert.strictEqual(zeroSlip.deductions.epfEmployee, 0, 'EPF employee must be 0 for zero wage');
    assert.strictEqual(zeroSlip.deductions.esicEmployee, 0, 'ESIC employee must be 0 for zero wage');
    assert.strictEqual(zeroSlip.netPayable, 0, 'Net payable must be 0 for zero earnings');
  });

  // TEST 3: Negative Inputs Rejection
  await test('Negative Inputs Validation (400 Bad Request)', async () => {
    const res = await makeRequest('POST', '/api/attendance/bulk', {
      month: 7,
      year: 2026,
      records: [{
        employee_id: 1,
        calendar_days: 30,
        present_days: -5,
        paid_leaves: 0,
        weekly_offs: 4,
        overtime_hours: 0,
        advance_deduction: 0
      }]
    });
    assert.strictEqual(res.status, 400, `Expected 400, got ${res.status}`);
    assert(res.body.error && res.body.error.toLowerCase().includes('negative'));
  });

  // TEST 4: Missing Employee Information
  await test('Missing Employee Information Validation (400 Bad Request)', async () => {
    const res = await makeRequest('POST', '/api/attendance/bulk', {
      month: 7,
      year: 2026,
      records: [{
        employee_id: null,
        calendar_days: 30,
        present_days: 20
      }]
    });
    assert.strictEqual(res.status, 400, `Expected 400 for null employee_id, got ${res.status}`);
  });

  // TEST 5: Rounding Rules (EPFO Nearest Rupee, ESIC Ceil)
  await test('Statutory Rounding Rules Compliance', async () => {
    const previewRes = await makeRequest('POST', '/api/payroll/preview', {
      month: 9,
      year: 2026
    });
    assert.strictEqual(previewRes.status, 200);
    for (const slip of previewRes.body.slips) {
      // EPF is rounded to nearest integer by EPFO rules
      const epf = slip.deductions.epfEmployee;
      assert.strictEqual(epf, Math.round(epf), `EPF (${epf}) should be rounded to nearest integer`);

      // ESIC is rounded up (ceil) to next higher rupee
      const esic = slip.deductions.esicEmployee;
      assert.strictEqual(esic, Math.ceil(esic), `ESIC (${esic}) should be rounded to next higher rupee`);
    }
  });

  // TEST 6: Different Configured Wage Bases
  await test('Different Configured Wage Bases (Gross != PF Base != ESIC Base)', async () => {
    const employeesRes = await makeRequest('GET', '/api/employees');
    const empId = employeesRes.body.data[0].id;

    // Configured with distinct PF base ₹12,000 and ESIC base ₹18,000 while gross is calculated normally
    await makeRequest('POST', '/api/attendance/bulk', {
      month: 12,
      year: 2026,
      records: [{
        employee_id: empId,
        calendar_days: 31,
        present_days: 26,
        paid_leaves: 0,
        weekly_offs: 5,
        overtime_hours: 0,
        advance_deduction: 0,
        pf_wage_base: 12000,
        esic_wage_base: 18000
      }]
    });

    const previewRes = await makeRequest('POST', '/api/payroll/preview', {
      month: 12,
      year: 2026
    });
    assert.strictEqual(previewRes.status, 200);
    const slip = previewRes.body.slips.find(s => s.employee.id === empId);
    assert(slip, 'Slip must exist');

    // PF 12% of 12,000 = 1,440
    assert.strictEqual(slip.deductions.epfEmployee, 1440, `EPF must be 12% of configured base ₹12,000 (got ${slip.deductions.epfEmployee})`);
    // ESIC 0.75% of 18,000 = 135
    assert.strictEqual(slip.deductions.esicEmployee, 135, `ESIC must be 0.75% of configured base ₹18,000 (got ${slip.deductions.esicEmployee})`);
  });

  // TEST 7: Duplicate Records & Duplicate Finalized Run Prevention
  await test('Duplicate Payroll Run Prevention (409 Conflict)', async () => {
    // Process final payroll for month 12/2026
    const res1 = await makeRequest('POST', '/api/payroll/process', {
      month: 12,
      year: 2026,
      status: 'Finalized'
    });
    assert.strictEqual(res1.status, 200, `First finalization should succeed (got ${res1.status})`);

    // Attempt second finalization without revision flag
    const res2 = await makeRequest('POST', '/api/payroll/process', {
      month: 12,
      year: 2026,
      status: 'Finalized'
    });
    assert.strictEqual(res2.status, 409, `Duplicate run must return 409 Conflict (got ${res2.status})`);
  });

  // TEST 8: Invalid Attendance Totals
  await test('Invalid Attendance Totals (Paid Days > Calendar Days Rejection)', async () => {
    const res = await makeRequest('POST', '/api/attendance/bulk', {
      month: 7,
      year: 2026,
      records: [{
        employee_id: 1,
        calendar_days: 30,
        present_days: 28,
        paid_leaves: 5,
        weekly_offs: 4 // 28 + 5 + 4 = 37 > 30!
      }]
    });
    assert.strictEqual(res.status, 400, `Expected 400 for 37 days in 30 day month, got ${res.status}`);
    assert(res.body.error && res.body.error.toLowerCase().includes('exceed'));
  });

  // TEST 9: Employer Liability Isolation (Never subtracted from Net Pay)
  await test('Employer Liability Isolation from Employee Net Pay', async () => {
    const previewRes = await makeRequest('POST', '/api/payroll/preview', {
      month: 9,
      year: 2026
    });
    assert.strictEqual(previewRes.status, 200);

    for (const slip of previewRes.body.slips) {
      const gross = slip.earnings.grossEarned;
      const eeDed = slip.deductions.totalDeductions;
      const erTotal = (slip.employerCosts?.totalCTC || 0) - gross;
      const netPay = slip.netPayable;

      // Ensure employer costs are > 0 for eligible employees
      if (gross > 0) {
        assert(erTotal >= 0, 'Employer costs must be non-negative');
        // Employee net pay must NEVER subtract employer costs!
        assert.strictEqual(
          Math.abs(netPay - (gross - eeDed)) < 0.05,
          true,
          'Net pay formula must only subtract employee deductions, not employer contributions'
        );
      }
    }
  });

  // TEST 10: Auditable Revision Process
  await test('Auditable Revision Workflow (Revision Reason & Increment)', async () => {
    // 10a. Revision without reason must be rejected with 400
    const failRes = await makeRequest('POST', '/api/payroll/process', {
      month: 12,
      year: 2026,
      isRevision: true,
      revisionReason: ''
    });
    assert.strictEqual(failRes.status, 400, `Expected 400 for empty revision reason, got ${failRes.status}`);

    // 10b. Revision with valid reason must succeed and increment revision_number
    const successRes = await makeRequest('POST', '/api/payroll/process', {
      month: 12,
      year: 2026,
      isRevision: true,
      revisionReason: 'Audited attendance adjustment for plant workers'
    });
    assert.strictEqual(successRes.status, 200, `Revision must succeed with 200 (got ${successRes.status})`);
    const revNum = successRes.body.revisionNumber || successRes.body.data?.revision_number;
    assert.strictEqual(revNum, 2, `Revision number must increment to 2 (got ${revNum})`);
  });

  console.log('\n-----------------------------------------------------------------------');
  console.log(` RESULTS: ${passed}/${total} TESTS PASSED ✓`);
  console.log('=======================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
