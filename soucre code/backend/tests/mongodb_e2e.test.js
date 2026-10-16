/**
 * Salary Enroll Pay System — MongoDB Atlas End-to-End Verification Suite
 *
 * Verifies:
 * 1. MongoDB Atlas connectivity and Mongoose model binding
 * 2. Administrator authentication & JWT generation
 * 3. Unauthorized access rejection (401 / 403)
 * 4. Employee registration and persistence in MongoDB Atlas
 * 5. Employee updates and persistence
 * 6. Duplicate identifier prevention (UAN, ESIC IP, Emp Code)
 * 7. Secure document upload and stream retrieval
 * 8. Monthly attendance and wage inputs in MongoDB
 * 9. Input validation (negative numbers, exceeding calendar days)
 * 10. Genuine C++17 OOP calculation engine IPC execution
 * 11. Draft payroll state and statutory export blocking
 * 12. Finalized payroll locking and audit logging
 * 13. EPFO ECR 2.0 (#~#) and ESIC Excel (.xlsx) exports
 * 14. Export history logging in MongoDB Atlas
 * 15. Safe cleanup leaving database clean for the user
 */

const http = require('http');
const assert = require('assert');
const mongoose = require('mongoose');
const { Employee, EmployeeDocument, Attendance, PayrollRun, PayrollRecord, ExportHistory, StatutoryRule, Company } = require('../src/models');

const BASE_URL = 'http://127.0.0.1:5001';

function makeRequest(method, reqPath, data = null, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, BASE_URL);
    const payload = data ? JSON.stringify(data) : null;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...customHeaders
      }
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const text = buffer.toString('utf8');
        let parsed = null;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          parsed = text;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
          raw: text,
          buffer
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function uploadFileRequest(reqPath, fields, fileInfo, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const boundary = '----MongoAuditBoundary' + Date.now();
    const url = new URL(reqPath, BASE_URL);
    const parts = [];

    for (const [key, val] of Object.entries(fields)) {
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`));
    }

    if (fileInfo) {
      const header = `--${boundary}\r\nContent-Disposition: form-data; name="${fileInfo.fieldname}"; filename="${fileInfo.filename}"\r\nContent-Type: ${fileInfo.mimetype}\r\n\r\n`;
      parts.push(Buffer.from(header));
      parts.push(fileInfo.content);
      parts.push(Buffer.from('\r\n'));
    }

    parts.push(Buffer.from(`--${boundary}--\r\n`));
    const fullBody = Buffer.concat(parts);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length,
        ...customHeaders
      }
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const text = buffer.toString('utf8');
        let parsed = null;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          parsed = text;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
          raw: text
        });
      });
    });

    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

async function runTests() {
  require('dotenv').config();
  await mongoose.connect(process.env.MONGODB_URI);

  console.log('=======================================================================');
  console.log('    SALARY ENROLL PAY SYSTEM — MONGODB ATLAS END-TO-END VERIFICATION   ');
  console.log('=======================================================================');

  let passed = 0;
  const total = 15;
  let authToken = null;
  let testEmpId = null;
  let testDocId = null;
  let testRunId = null;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Backend & MongoDB Atlas Health Verification
    // -------------------------------------------------------------------------
    process.stdout.write('[TEST 1] MongoDB Atlas Connection & C++ Engine Health ... ');
    const health = await makeRequest('GET', '/api/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.body.status, 'online');
    assert.strictEqual(health.body.database.status, 'MongoDB Atlas Connected');
    assert.strictEqual(health.body.cppEngine.ready, true);
    console.log('PASSED ✓');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 2: Administrator Authentication & JWT Issuance
    // -------------------------------------------------------------------------
    process.stdout.write('[TEST 2] Administrator Login & JWT Authentication ... ');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@salaryenroll.com',
      password: 'Admin@12345'
    });
    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginRes.body.token, 'Must return JWT token');
    assert.strictEqual(loginRes.body.user.role, 'admin');
    authToken = loginRes.body.token;

    // Verify token with /api/auth/me
    const meRes = await makeRequest('GET', '/api/auth/me', null, {
      'Authorization': `Bearer ${authToken}`
    });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.body.user.email, 'admin@salaryenroll.com');
    console.log('PASSED ✓');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 3: Unauthorized Access Protection
    // -------------------------------------------------------------------------
    process.stdout.write('[TEST 3] Unauthorized Access & Invalid Password Protection ... ');
    // 3a. Invalid credentials
    const badLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@salaryenroll.com',
      password: 'WrongPassword'
    });
    assert.strictEqual(badLogin.status, 401);

    // 3b. Missing token on protected endpoint
    const unauthReq = await makeRequest('GET', '/api/employees');
    assert.strictEqual(unauthReq.status, 401);
    console.log('PASSED ✓');
    passed++;

    // Pre-clean any stale test records from prior runs
    await Employee.deleteMany({ emp_code: 'TESTEMP01' });

    // -------------------------------------------------------------------------
    // TEST 4: Real Employee Master Registration in MongoDB Atlas
    // -------------------------------------------------------------------------
    process.stdout.write('[TEST 4] Register Employee & Verify MongoDB Persistence ... ');
    const empPayload = {
      emp_code: 'TESTEMP01',
      full_name: '[TEST-AUDIT] Anita Deshmukh',
      gender: 'Female',
      designation: 'Senior Process Engineer',
      department: 'Engineering',
      joining_date: '2026-02-01',
      bank_name: 'HDFC Bank',
      bank_account: '50100223344556',
      ifsc: 'HDFC0001234',
      pan: 'ABCDE1111F',
      uan: '101999999999',
      esic_ip: '9988776655',
      pf_opt_out: false,
      esic_opt_out: false,
      basic_wage: 15000,
      dearness_allowance: 3000,
      house_rent_allowance: 6000,
      conveyance_allowance: 1600,
      medical_allowance: 1250,
      special_allowance: 3150,
      other_allowance: 0
    };

    const createRes = await makeRequest('POST', '/api/employees', empPayload, {
      'Authorization': `Bearer ${authToken}`
    });
    assert.strictEqual(createRes.status, 201, `Create failed: ${createRes.raw}`);
    testEmpId = createRes.body.id;
    assert.ok(testEmpId, 'Must return employee ID');

    // Query directly from MongoDB via Mongoose model
    const mongoEmp = await Employee.findById(testEmpId);
    assert.ok(mongoEmp, 'Employee must exist in MongoDB Atlas');
    assert.strictEqual(mongoEmp.emp_code, 'TESTEMP01');
    assert.strictEqual(mongoEmp.full_name, '[TEST-AUDIT] Anita Deshmukh');
    assert.strictEqual(mongoEmp.salary_structure.monthly_gross, 30000);
    console.log('PASSED ✓');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 5: Employee Update & Database Persistence
    // -------------------------------------------------------------------------
    process.stdout.write('[TEST 5] Employee Edit & MongoDB Update Persistence ... ');
    const updateRes = await makeRequest(
      'PUT',
      `/api/employees/${testEmpId}`,
      {
        designation: 'Lead Systems Engineer',
        basic_wage: 18000,
        house_rent_allowance: 7200
      },
      { 'Authorization': `Bearer ${authToken}` }
    );
    assert.strictEqual(updateRes.status, 200);

    const updatedEmp = await Employee.findById(testEmpId);
    assert.strictEqual(updatedEmp.designation, 'Lead Systems Engineer');
    assert.strictEqual(updatedEmp.salary_structure.basic_wage, 18000);
    console.log('PASSED ✓');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 6: Duplicate Identifier Validation (UAN, ESIC IP, Emp Code)
    // -------------------------------------------------------------------------
    process.stdout.write('[TEST 6] Duplicate Identifier Prevention (UAN, ESIC, Code) ... ');
    // 6a. Duplicate UAN
    const dupUan = await makeRequest(
      'POST',
      '/api/employees',
      { ...empPayload, emp_code: 'TESTEMP02', full_name: 'Duplicate UAN' },
      { 'Authorization': `Bearer ${authToken}` }
    );
    assert.strictEqual(dupUan.status, 400);
    assert.ok(dupUan.body.error.includes('already registered'));

    // 6b. Duplicate ESIC IP
    const dupEsic = await makeRequest(
      'POST',
      '/api/employees',
      { ...empPayload, emp_code: 'TESTEMP03', uan: '102999999999', full_name: 'Duplicate ESIC' },
      { 'Authorization': `Bearer ${authToken}` }
    );
    assert.strictEqual(dupEsic.status, 400);

    // 6c. Duplicate Code
    const dupCode = await makeRequest(
      'POST',
      '/api/employees',
      { ...empPayload, uan: '103999999999', esic_ip: '9988776654', full_name: 'Duplicate Code' },
      { 'Authorization': `Bearer ${authToken}` }
    );
    assert.strictEqual(dupCode.status, 400);
    console.log('PASSED ✓');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 7: Secure Document Upload & Stream Retrieval
    // -------------------------------------------------------------------------
    process.stdout.write('[TEST 7] Secure Document Upload, Inspection & Streaming ... ');
    const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (E-Pehchan Audit) >>\nendobj\ntrailer\n<< >>\n%%EOF');
    const uploadRes = await uploadFileRequest(
      `/api/employees/${testEmpId}/documents`,
      { doc_type: 'E-Pehchan Card (ESIC)', doc_number: 'IP-DOC-TEST-01' },
      { fieldname: 'document', filename: 'e_pehchan_test.pdf', mimetype: 'application/pdf', content: dummyPdf },
      { 'Authorization': `Bearer ${authToken}` }
    );
    assert.strictEqual(uploadRes.status, 201);
    testDocId = uploadRes.body.docId;

    // View stream
    const viewRes = await makeRequest(
      'GET',
      `/api/employees/${testEmpId}/documents/${testDocId}/view`,
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );
    assert.strictEqual(viewRes.status, 200);
    assert.strictEqual(viewRes.headers['content-type'], 'application/pdf');
    assert.ok(viewRes.headers['content-disposition'].includes('inline'));

    // Verify document record in MongoDB
    const mongoDoc = await EmployeeDocument.findById(testDocId);
    assert.ok(mongoDoc);
    assert.strictEqual(mongoDoc.doc_type, 'E-Pehchan Card (ESIC)');
    console.log('PASSED ✓');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 8: Monthly Attendance & Wage Entry in MongoDB Atlas
    // -------------------------------------------------------------------------
    process.stdout.write('[TEST 8] Save Monthly Attendance & Wage Inputs in MongoDB ... ');
    const attRes = await makeRequest(
      'POST',
      '/api/attendance/bulk',
      {
        month: 10,
        year: 2026,
        records: [{
          employee_id: testEmpId,
          calendar_days: 31,
          present_days: 27,
          paid_leaves: 0,
          weekly_offs: 4,
          overtime_hours: 8,
          overtime_amount: 1600,
          advance_deduction: 2500,
          other_deductions: 500,
          pf_wage_base: 15000,
          esic_wage_base: 22000
        }]
      },
      { 'Authorization': `Bearer ${authToken}` }
    );
    assert.strictEqual(attRes.status, 200);

    const mongoAtt = await Attendance.findOne({ employee: testEmpId, month: 10, year: 2026 });
    assert.ok(mongoAtt, 'Attendance must be saved in MongoDB Atlas');
    assert.strictEqual(mongoAtt.present_days, 27);
    assert.strictEqual(mongoAtt.advance_deduction, 2500);
    console.log('PASSED ✓');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 9: Input Validation (Negative Values & Excessive Days)
    // -------------------------------------------------------------------------
    process.stdout.write('[TEST 9] Input Validation (Negative numbers & day overflow) ... ');
    const negRes = await makeRequest(
      'POST',
      '/api/attendance/bulk',
      {
        month: 10,
        year: 2026,
        records: [{ employee_id: testEmpId, present_days: -2 }]
      },
      { 'Authorization': `Bearer ${authToken}` }
    );
    assert.strictEqual(negRes.status, 400);

    const overRes = await makeRequest(
      'POST',
      '/api/attendance/bulk',
      {
        month: 10,
        year: 2026,
        records: [{ employee_id: testEmpId, calendar_days: 30, present_days: 28, weekly_offs: 5 }]
      },
      { 'Authorization': `Bearer ${authToken}` }
    );
    assert.strictEqual(overRes.status, 400);
    console.log('PASSED ✓');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 10: C++17 OOP Calculation Engine Execution
    // -------------------------------------------------------------------------
    process.stdout.write('[TEST 10] C++17 Calculation Engine IPC Execution ... ');
    const previewRes = await makeRequest(
      'POST',
      '/api/payroll/preview',
      { month: 10, year: 2026 },
      { 'Authorization': `Bearer ${authToken}` }
    );
    assert.strictEqual(previewRes.status, 200);
    assert.ok(previewRes.body.engine && previewRes.body.engine.includes('C++17 OOP'));
    assert.ok(previewRes.body.slips && previewRes.body.slips.length > 0);
    console.log('PASSED ✓');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 11: Draft Payroll State & Statutory Export Blocking
    // -------------------------------------------------------------------------
    process.stdout.write('[TEST 11] Draft Payroll State & Export Blocking Gate ... ');
    const draftRes = await makeRequest(
      'POST',
      '/api/payroll/draft',
      { month: 10, year: 2026 },
      { 'Authorization': `Bearer ${authToken}` }
    );
    assert.strictEqual(draftRes.status, 200, `Draft creation failed: ${draftRes.raw}`);
    testRunId = draftRes.body.runId;

    // Verify statutory ECR export is blocked for Draft runs
    const blockedPf = await makeRequest(
      'GET',
      `/api/exports/pf-ecr?runId=${testRunId}`,
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );
    assert.strictEqual(blockedPf.status, 400);
    assert.ok(blockedPf.body.error.includes('Draft'));

    const blockedEsic = await makeRequest(
      'GET',
      `/api/exports/esic-excel?runId=${testRunId}`,
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );
    assert.strictEqual(blockedEsic.status, 400);
    console.log('PASSED ✓');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 12: Finalized Payroll Locking in MongoDB Atlas
    // -------------------------------------------------------------------------
    process.stdout.write('[TEST 12] Finalize Payroll & Lock Records in MongoDB Atlas ... ');
    const finalizeRes = await makeRequest(
      'POST',
      '/api/payroll/process',
      { month: 10, year: 2026 },
      { 'Authorization': `Bearer ${authToken}` }
    );
    assert.strictEqual(finalizeRes.status, 200);
    assert.strictEqual(finalizeRes.body.status, 'Finalized');

    const mongoRun = await PayrollRun.findById(testRunId);
    assert.strictEqual(mongoRun.status, 'Finalized');
    assert.ok(mongoRun.finalized_at);

    const mongoRecords = await PayrollRecord.find({ payroll_run: testRunId });
    assert.ok(mongoRecords.length > 0, 'PayrollRecord slips must exist in MongoDB');
    console.log('PASSED ✓');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 13: Official EPFO ECR 2.0 & ESIC Excel Exports
    // -------------------------------------------------------------------------
    process.stdout.write('[TEST 13] Generate Verified EPFO ECR 2.0 & ESIC Excel ... ');
    // 13a. PF ECR (#~# delimited)
    const pfExport = await makeRequest(
      'GET',
      `/api/exports/pf-ecr?runId=${testRunId}`,
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );
    assert.strictEqual(pfExport.status, 200);
    const lines = pfExport.raw.trim().split('\n');
    assert.ok(lines.length > 0);
    for (const l of lines) {
      const cols = l.split('#~#');
      assert.strictEqual(cols.length, 11, 'EPFO ECR row must have 11 columns');
    }

    // 13b. ESIC Excel (.xlsx binary)
    const esicExport = await makeRequest(
      'GET',
      `/api/exports/esic-excel?runId=${testRunId}`,
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );
    assert.strictEqual(esicExport.status, 200);
    assert.strictEqual(esicExport.buffer[0], 0x50); // PK zip header
    assert.strictEqual(esicExport.buffer[1], 0x4B);
    console.log('PASSED ✓');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 14: Export History Audit Logging in MongoDB Atlas
    // -------------------------------------------------------------------------
    process.stdout.write('[TEST 14] Export History Logging in MongoDB Atlas ... ');
    const history = await ExportHistory.find({ payroll_run: testRunId });
    assert.ok(history.length >= 2, 'Both PF and ESIC exports must be logged');
    const pfLog = history.find(h => h.export_type === 'EPFO_ECR');
    const esicLog = history.find(h => h.export_type === 'ESIC_EXCEL');
    assert.ok(pfLog && esicLog);
    console.log('PASSED ✓');
    passed++;

    // -------------------------------------------------------------------------
    // TEST 15: Clean Database for User (Zero Sample Data Left Behind)
    // -------------------------------------------------------------------------
    process.stdout.write('[TEST 15] Database Cleanup (Zero Sample Data Left in MongoDB) ... ');
    if (testDocId) {
      await makeRequest('DELETE', `/api/employees/documents/${testDocId}`, null, { 'Authorization': `Bearer ${authToken}` });
    }
    if (testEmpId) {
      await makeRequest('DELETE', `/api/employees/${testEmpId}`, null, { 'Authorization': `Bearer ${authToken}` });
    }
    if (testRunId) {
      await ExportHistory.deleteMany({ payroll_run: testRunId });
      await PayrollRecord.deleteMany({ payroll_run: testRunId });
      await PayrollRun.findByIdAndDelete(testRunId);
    }
    await Attendance.deleteMany({ month: 10, year: 2026 });

    // Confirm employee count is 0
    const finalCount = await Employee.countDocuments();
    assert.strictEqual(finalCount, 0, 'Database must have 0 employees after test cleanup');
    console.log('PASSED ✓');
    passed++;

    await mongoose.disconnect();
    console.log('-----------------------------------------------------------------------');
    console.log(` RESULTS: ${passed}/${total} MONGODB VERIFICATION TESTS PASSED (100%) ✓`);
    console.log('=======================================================================');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    if (err.stack) console.error(err.stack);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

runTests();
