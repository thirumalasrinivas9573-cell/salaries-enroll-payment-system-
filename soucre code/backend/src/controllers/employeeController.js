const path = require('path');
const fs = require('fs');
const { Employee, EmployeeDocument, AuditLog } = require('../models');
const { STORAGE_DIR } = require('../middleware/upload');
const { sanitizeForLogging } = require('../middleware/auth');

/**
 * Generates the next sequential unique employee code (e.g. EMP001).
 */
async function generateNextEmployeeCode() {
  const employees = await Employee.find({ emp_code: /^EMP\d+$/i }, 'emp_code').lean();
  let maxNum = 0;
  for (const emp of employees) {
    const numPart = parseInt(emp.emp_code.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(numPart) && numPart > maxNum) {
      maxNum = numPart;
    }
  }
  const nextNum = maxNum + 1;
  return `EMP${String(nextNum).padStart(3, '0')}`;
}

/**
 * Validates employee input fields and checks for duplicate unique identifiers in MongoDB.
 */
async function validateEmployeeInput(data, currentId = null) {
  const errors = [];

  // Required: Full Name
  if (!data.full_name || !data.full_name.trim()) {
    errors.push('Full employee legal name is required.');
  }

  // Format validations
  if (data.uan && data.uan.trim()) {
    const cleanUan = data.uan.trim();
    if (!/^\d{12}$/.test(cleanUan)) {
      errors.push('EPFO UAN must be exactly 12 numeric digits.');
    }
  }

  if (data.esic_ip && data.esic_ip.trim()) {
    const cleanEsic = data.esic_ip.trim();
    if (!/^\d{10}$|^\d{17}$/.test(cleanEsic)) {
      errors.push('ESIC Insurance Person (IP) number must be 10 or 17 numeric digits.');
    }
  }

  if (data.pan && data.pan.trim()) {
    const cleanPan = data.pan.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      errors.push('PAN card format is invalid. Standard format: ABCDE1234F.');
    }
  }

  if (data.aadhaar && data.aadhaar.trim()) {
    const cleanAadhaar = data.aadhaar.trim().replace(/\s|-/g, '');
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      errors.push('Aadhaar number must be exactly 12 numeric digits.');
    }
  }

  if (data.ifsc && data.ifsc.trim()) {
    const cleanIfsc = data.ifsc.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      errors.push('IFSC code is invalid. Standard format: SBIN0001234.');
    }
  }

  if (errors.length > 0) return errors;

  // Duplicate checks against MongoDB
  const idQuery = currentId ? { _id: { $ne: currentId } } : {};

  // 1. Employee Code Duplicate Check
  if (data.emp_code && data.emp_code.trim()) {
    const code = data.emp_code.trim().toUpperCase();
    const existingCode = await Employee.findOne({ emp_code: code, ...idQuery });
    if (existingCode) {
      errors.push(`Employee ID '${code}' is already assigned to ${existingCode.full_name}.`);
    }
  }

  // 2. UAN Duplicate Check
  if (data.uan && data.uan.trim()) {
    const uan = data.uan.trim();
    const existingUan = await Employee.findOne({ uan, ...idQuery });
    if (existingUan) {
      errors.push(`UAN '${uan}' is already registered for employee ${existingUan.emp_code} (${existingUan.full_name}). Duplicate EPFO UAN is prohibited.`);
    }
  }

  // 3. ESIC IP Duplicate Check
  if (data.esic_ip && data.esic_ip.trim()) {
    const ip = data.esic_ip.trim();
    const existingEsic = await Employee.findOne({ esic_ip: ip, ...idQuery });
    if (existingEsic) {
      errors.push(`ESIC IP number '${ip}' is already registered for employee ${existingEsic.emp_code} (${existingEsic.full_name}).`);
    }
  }

  // 4. PAN Duplicate Check
  if (data.pan && data.pan.trim()) {
    const pan = data.pan.trim().toUpperCase();
    const existingPan = await Employee.findOne({ pan, ...idQuery });
    if (existingPan) {
      errors.push(`PAN '${pan}' is already registered for employee ${existingPan.emp_code} (${existingPan.full_name}).`);
    }
  }

  return errors;
}

// 1. Generate unique employee code API
async function getNextId(req, res) {
  try {
    const nextCode = await generateNextEmployeeCode();
    res.json({ success: true, nextCode });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 2. List all employees with search & filters
async function getAllEmployees(req, res) {
  try {
    const { search, department, active } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const term = search.trim();
      const regex = new RegExp(term, 'i');
      filter.$or = [
        { full_name: regex },
        { emp_code: regex },
        { uan: regex },
        { esic_ip: regex },
        { pan: regex },
        { department: regex },
        { designation: regex }
      ];
    }

    if (department && department !== 'All') {
      filter.department = department;
    }

    if (active !== undefined && active !== 'All') {
      filter.active = active === 'true' || active === '1';
    }

    const employees = await Employee.find(filter).sort({ emp_code: 1 });

    // Fetch document counts
    const employeeIds = employees.map(e => e._id);
    const docCounts = await EmployeeDocument.aggregate([
      { $match: { employee: { $in: employeeIds } } },
      { $group: { _id: '$employee', count: { $sum: 1 } } }
    ]);
    const docCountMap = {};
    docCounts.forEach(dc => {
      docCountMap[dc._id.toString()] = dc.count;
    });

    const flattened = employees.map(e => {
      const json = e.toJSON();
      const salary = e.salary_structure || {};
      return {
        ...json,
        id: e._id.toString(),
        basic_wage: salary.basic_wage || 0,
        dearness_allowance: salary.dearness_allowance || 0,
        house_rent_allowance: salary.house_rent_allowance || 0,
        conveyance_allowance: salary.conveyance_allowance || 0,
        medical_allowance: salary.medical_allowance || 0,
        special_allowance: salary.special_allowance || 0,
        other_allowance: salary.other_allowance || 0,
        monthly_gross: salary.monthly_gross || 0,
        document_count: docCountMap[e._id.toString()] || 0
      };
    });

    res.json({ success: true, count: flattened.length, data: flattened });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 3. Get single employee with dossier & documents
async function getEmployeeById(req, res) {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({ success: false, error: `Employee #${id} not found` });
    }

    const documents = await EmployeeDocument.find({ employee: id }).sort({ createdAt: -1 });

    const salary = employee.salary_structure || {};
    const responseData = {
      ...employee.toJSON(),
      id: employee._id.toString(),
      basic_wage: salary.basic_wage || 0,
      dearness_allowance: salary.dearness_allowance || 0,
      house_rent_allowance: salary.house_rent_allowance || 0,
      conveyance_allowance: salary.conveyance_allowance || 0,
      medical_allowance: salary.medical_allowance || 0,
      special_allowance: salary.special_allowance || 0,
      other_allowance: salary.other_allowance || 0,
      monthly_gross: salary.monthly_gross || 0,
      documents: documents.map(d => ({
        ...d.toJSON(),
        id: d._id.toString(),
        employee_id: id
      }))
    };

    res.json({ success: true, data: responseData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 4. Create new employee
async function createEmployee(req, res) {
  try {
    let {
      emp_code, full_name, gender, dob, joining_date, designation, department,
      phone, email, bank_name, bank_account, ifsc, pan, aadhaar, uan, esic_ip,
      pf_opt_out = false, esic_opt_out = false, active = true,
      basic_wage = 0, dearness_allowance = 0, house_rent_allowance = 0,
      conveyance_allowance = 0, medical_allowance = 0, special_allowance = 0, other_allowance = 0
    } = req.body;

    if (!emp_code || !emp_code.trim()) {
      emp_code = await generateNextEmployeeCode();
    } else {
      emp_code = emp_code.trim().toUpperCase();
    }

    const payload = {
      emp_code, full_name, gender, dob, joining_date, designation, department,
      phone, email, bank_name, bank_account, ifsc, pan, aadhaar, uan, esic_ip
    };

    const validationErrors = await validateEmployeeInput(payload);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, error: validationErrors.join(' ') });
    }

    const basic = Number(basic_wage) || 0;
    const da = Number(dearness_allowance) || 0;
    const hra = Number(house_rent_allowance) || 0;
    const conv = Number(conveyance_allowance) || 0;
    const med = Number(medical_allowance) || 0;
    const sp = Number(special_allowance) || 0;
    const oth = Number(other_allowance) || 0;
    const gross = basic + da + hra + conv + med + sp + oth;

    const newEmployee = await Employee.create({
      emp_code,
      full_name: full_name.trim(),
      gender: gender || 'Male',
      dob: dob || null,
      joining_date: joining_date || Date.now(),
      designation: designation ? designation.trim() : 'Staff',
      department: department ? department.trim() : 'Operations',
      phone: phone ? phone.trim() : '',
      email: email ? email.trim() : '',
      bank_name: bank_name ? bank_name.trim() : '',
      bank_account: bank_account ? bank_account.trim() : '',
      ifsc: ifsc ? ifsc.trim().toUpperCase() : '',
      pan: pan ? pan.trim().toUpperCase() : '',
      aadhaar: aadhaar ? aadhaar.trim() : '',
      uan: uan ? uan.trim() : '',
      esic_ip: esic_ip ? esic_ip.trim() : '',
      pf_opt_out: Boolean(pf_opt_out),
      esic_opt_out: Boolean(esic_opt_out),
      active: active !== undefined ? Boolean(active) : true,
      status: 'Active',
      salary_structure: {
        basic_wage: basic,
        dearness_allowance: da,
        house_rent_allowance: hra,
        conveyance_allowance: conv,
        medical_allowance: med,
        special_allowance: sp,
        other_allowance: oth,
        monthly_gross: gross
      }
    });

    await AuditLog.create({
      action: 'EMPLOYEE_CREATE',
      entity: 'Employee',
      entity_id: newEmployee._id.toString(),
      user_name: req.user?.name || 'Administrator',
      details: { emp_code: newEmployee.emp_code, full_name: newEmployee.full_name }
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Employee ${emp_code} (${full_name}) created successfully.`,
      id: newEmployee._id.toString(),
      emp_code: newEmployee.emp_code,
      data: newEmployee.toJSON()
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'unique field';
      return res.status(400).json({ success: false, error: `Duplicate error: Employee with this ${field} already exists.` });
    }
    res.status(500).json({ success: false, error: err.message });
  }
}

// 5. Update employee
async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const {
      emp_code, full_name, gender, dob, joining_date, designation, department,
      phone, email, bank_name, bank_account, ifsc, pan, aadhaar, uan, esic_ip,
      pf_opt_out, esic_opt_out, active, status,
      basic_wage, dearness_allowance, house_rent_allowance,
      conveyance_allowance, medical_allowance, special_allowance, other_allowance
    } = req.body;

    const payload = {
      emp_code: emp_code !== undefined ? emp_code : employee.emp_code,
      full_name: full_name !== undefined ? full_name : employee.full_name,
      uan: uan !== undefined ? uan : employee.uan,
      esic_ip: esic_ip !== undefined ? esic_ip : employee.esic_ip,
      pan: pan !== undefined ? pan : employee.pan,
      aadhaar: aadhaar !== undefined ? aadhaar : employee.aadhaar,
      ifsc: ifsc !== undefined ? ifsc : employee.ifsc
    };

    const validationErrors = await validateEmployeeInput(payload, id);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, error: validationErrors.join(' ') });
    }

    if (emp_code !== undefined) employee.emp_code = emp_code.trim().toUpperCase();
    if (full_name !== undefined) employee.full_name = full_name.trim();
    if (gender !== undefined) employee.gender = gender;
    if (dob !== undefined) employee.dob = dob;
    if (joining_date !== undefined) employee.joining_date = joining_date;
    if (designation !== undefined) employee.designation = designation.trim();
    if (department !== undefined) employee.department = department.trim();
    if (phone !== undefined) employee.phone = phone.trim();
    if (email !== undefined) employee.email = email.trim();
    if (bank_name !== undefined) employee.bank_name = bank_name.trim();
    if (bank_account !== undefined) employee.bank_account = bank_account.trim();
    if (ifsc !== undefined) employee.ifsc = ifsc.trim().toUpperCase();
    if (pan !== undefined) employee.pan = pan.trim().toUpperCase();
    if (aadhaar !== undefined) employee.aadhaar = aadhaar.trim();
    if (uan !== undefined) employee.uan = uan.trim();
    if (esic_ip !== undefined) employee.esic_ip = esic_ip.trim();
    if (pf_opt_out !== undefined) employee.pf_opt_out = Boolean(pf_opt_out);
    if (esic_opt_out !== undefined) employee.esic_opt_out = Boolean(esic_opt_out);
    if (active !== undefined) employee.active = Boolean(active);
    if (status !== undefined) employee.status = status;

    // Update Salary Structure if provided
    const curSal = employee.salary_structure || {};
    const basic = basic_wage !== undefined ? Number(basic_wage) : curSal.basic_wage || 0;
    const da = dearness_allowance !== undefined ? Number(dearness_allowance) : curSal.dearness_allowance || 0;
    const hra = house_rent_allowance !== undefined ? Number(house_rent_allowance) : curSal.house_rent_allowance || 0;
    const conv = conveyance_allowance !== undefined ? Number(conveyance_allowance) : curSal.conveyance_allowance || 0;
    const med = medical_allowance !== undefined ? Number(medical_allowance) : curSal.medical_allowance || 0;
    const sp = special_allowance !== undefined ? Number(special_allowance) : curSal.special_allowance || 0;
    const oth = other_allowance !== undefined ? Number(other_allowance) : curSal.other_allowance || 0;
    const gross = basic + da + hra + conv + med + sp + oth;

    employee.salary_structure = {
      basic_wage: basic,
      dearness_allowance: da,
      house_rent_allowance: hra,
      conveyance_allowance: conv,
      medical_allowance: med,
      special_allowance: sp,
      other_allowance: oth,
      monthly_gross: gross
    };

    await employee.save();

    await AuditLog.create({
      action: 'EMPLOYEE_UPDATE',
      entity: 'Employee',
      entity_id: employee._id.toString(),
      user_name: req.user?.name || 'Administrator',
      details: { emp_code: employee.emp_code, full_name: employee.full_name }
    }).catch(() => {});

    res.json({
      success: true,
      message: `Employee ${employee.emp_code} (${employee.full_name}) updated successfully.`,
      data: employee.toJSON()
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'unique field';
      return res.status(400).json({ success: false, error: `Duplicate error: Employee with this ${field} already exists.` });
    }
    res.status(500).json({ success: false, error: err.message });
  }
}

// 6. Toggle Employee Status (Active / Inactive)
async function toggleEmployeeStatus(req, res) {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const newActive = active !== undefined ? Boolean(active) : !employee.active;
    employee.active = newActive;
    employee.status = newActive ? 'Active' : 'Inactive';
    await employee.save();

    res.json({
      success: true,
      message: `Employee ${employee.emp_code} status set to ${newActive ? 'Active' : 'Inactive'}.`,
      active: newActive
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 7. Delete Employee
async function deleteEmployee(req, res) {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    // Delete associated physical documents from disk
    const docs = await EmployeeDocument.find({ employee: id });
    for (const d of docs) {
      const diskPath = path.resolve(STORAGE_DIR, path.basename(d.file_path));
      if (fs.existsSync(diskPath)) {
        try { fs.unlinkSync(diskPath); } catch (e) {}
      }
    }
    await EmployeeDocument.deleteMany({ employee: id });

    await Employee.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'EMPLOYEE_DELETE',
      entity: 'Employee',
      entity_id: id,
      user_name: req.user?.name || 'Administrator',
      details: { emp_code: employee.emp_code, full_name: employee.full_name }
    }).catch(() => {});

    res.json({
      success: true,
      message: `Employee ${employee.emp_code} (${employee.full_name}) and associated records deleted.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 8. Secure Document Upload (including E-Pehchan PDF)
async function uploadDocument(req, res) {
  try {
    const { id } = req.params;
    const { doc_type, doc_number, expiry_date } = req.body;

    const emp = await Employee.findById(id);
    if (!emp) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No document file uploaded or invalid file format.' });
    }

    const originalName = path.basename(req.file.originalname);
    const storageFileName = path.basename(req.file.path);
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;
    const uploadedBy = req.user?.name || 'HR Admin';

    const newDoc = await EmployeeDocument.create({
      employee: id,
      doc_type: doc_type || 'General Document',
      doc_number: doc_number ? doc_number.trim() : '',
      file_name: originalName,
      file_path: storageFileName,
      file_size: fileSize,
      mime_type: mimeType,
      expiry_date: expiry_date || null,
      uploaded_by: uploadedBy,
      verified: true
    });

    res.status(201).json({
      success: true,
      message: `Document '${doc_type}' uploaded and verified successfully.`,
      docId: newDoc._id.toString(),
      file_name: originalName
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, error: err.message });
  }
}

// 9. Replace Existing Document
async function replaceDocument(req, res) {
  try {
    const { id, docId } = req.params;
    const { doc_number, expiry_date } = req.body;

    const existingDoc = await EmployeeDocument.findOne({ _id: docId, employee: id });
    if (!existingDoc) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, error: 'Document record not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No replacement file attached.' });
    }

    // Delete old physical file
    const oldDiskPath = path.resolve(STORAGE_DIR, existingDoc.file_path);
    if (fs.existsSync(oldDiskPath)) {
      try { fs.unlinkSync(oldDiskPath); } catch (e) {}
    }

    const newOriginalName = path.basename(req.file.originalname);
    const newStoragePath = path.basename(req.file.path);
    const newSize = req.file.size;
    const newMime = req.file.mimetype;
    const uploadedBy = req.user?.name || 'HR Admin';

    existingDoc.file_name = newOriginalName;
    existingDoc.file_path = newStoragePath;
    existingDoc.file_size = newSize;
    existingDoc.mime_type = newMime;
    if (doc_number !== undefined) existingDoc.doc_number = doc_number.trim();
    if (expiry_date !== undefined) existingDoc.expiry_date = expiry_date;
    existingDoc.uploaded_by = uploadedBy;

    await existingDoc.save();

    res.json({
      success: true,
      message: `Document '${existingDoc.doc_type}' replaced with '${newOriginalName}' successfully.`
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, error: err.message });
  }
}

// 10. Authenticated Document Inline View Stream
async function streamDocumentView(req, res) {
  try {
    const { id, docId } = req.params;
    const query = docId ? { _id: docId } : { _id: id };
    if (id && docId) query.employee = id;

    const doc = await EmployeeDocument.findOne(query);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const filePath = path.resolve(STORAGE_DIR, doc.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Document file missing from server storage' });
    }

    res.setHeader('Content-Type', doc.mime_type || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${doc.file_name}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 11. Authenticated Document Attachment Download
async function streamDocumentDownload(req, res) {
  try {
    const { id, docId } = req.params;
    const query = docId ? { _id: docId } : { _id: id };
    if (id && docId) query.employee = id;

    const doc = await EmployeeDocument.findOne(query);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const filePath = path.resolve(STORAGE_DIR, doc.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Document file missing from server storage' });
    }

    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.file_name}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 12. Delete Document
async function deleteDocument(req, res) {
  try {
    const docId = req.params.docId || req.params.id;
    const doc = await EmployeeDocument.findById(docId);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const diskPath = path.resolve(STORAGE_DIR, doc.file_path);
    if (fs.existsSync(diskPath)) {
      try { fs.unlinkSync(diskPath); } catch (e) {}
    }

    await EmployeeDocument.findByIdAndDelete(docId);
    res.json({ success: true, message: `Document '${doc.doc_type}' removed successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getNextId,
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
  deleteEmployee,
  uploadDocument,
  replaceDocument,
  streamDocumentView,
  streamDocumentDownload,
  deleteDocument
};
