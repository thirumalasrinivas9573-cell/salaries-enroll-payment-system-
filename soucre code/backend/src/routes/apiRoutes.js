const express = require('express');
const router = express.Router();

// Middleware
const { authenticateToken, requireRole } = require('../middleware/auth');
const { secureUpload } = require('../middleware/upload');

// Controllers
const authController = require('../controllers/authController');
const employeeController = require('../controllers/employeeController');
const attendanceController = require('../controllers/attendanceController');
const payrollController = require('../controllers/payrollController');
const exportController = require('../controllers/exportController');
const statutoryController = require('../controllers/statutoryController');
const dashboardController = require('../controllers/dashboardController');

// 1. Authentication Routes
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/signup', authController.register);
router.get('/auth/me', authenticateToken, authController.getCurrentUser);
router.post('/auth/logout', authenticateToken, authController.logout);

// 2. Dashboard (Real MongoDB counts & metrics)
router.get('/dashboard/stats', dashboardController.getDashboardStats);

// 3. Employees & Documents (Protected via authentication)
router.get('/employees/generate-id', authenticateToken, employeeController.getNextId);
router.get('/employees', authenticateToken, employeeController.getAllEmployees);
router.get('/employees/:id', authenticateToken, employeeController.getEmployeeById);
router.post('/employees', authenticateToken, requireRole(['admin', 'hr_manager']), employeeController.createEmployee);
router.put('/employees/:id', authenticateToken, requireRole(['admin', 'hr_manager']), employeeController.updateEmployee);
router.patch('/employees/:id/status', authenticateToken, requireRole(['admin', 'hr_manager']), employeeController.toggleEmployeeStatus);
router.delete('/employees/:id', authenticateToken, requireRole(['admin']), employeeController.deleteEmployee);

// Document Vault Routes (Secure authenticated streaming, no public URLs)
router.post('/employees/:id/documents', authenticateToken, requireRole(['admin', 'hr_manager']), secureUpload.single('document'), employeeController.uploadDocument);
router.put('/employees/:id/documents/:docId/replace', authenticateToken, requireRole(['admin', 'hr_manager']), secureUpload.single('document'), employeeController.replaceDocument);
router.get('/employees/:id/documents/:docId/view', authenticateToken, employeeController.streamDocumentView);
router.get('/employees/:id/documents/:docId/download', authenticateToken, employeeController.streamDocumentDownload);
router.delete('/employees/:id/documents/:docId', authenticateToken, requireRole(['admin', 'hr_manager']), employeeController.deleteDocument);
router.delete('/employees/documents/:docId', authenticateToken, requireRole(['admin', 'hr_manager']), employeeController.deleteDocument);

// 4. Attendance & Wage Entry (Protected)
router.get('/attendance', authenticateToken, attendanceController.getMonthlyAttendance);
router.post('/attendance/bulk', authenticateToken, requireRole(['admin', 'hr_manager']), attendanceController.saveMonthlyAttendance);

// 5. Payroll Processing & Slips (Protected)
router.post('/payroll/preview', authenticateToken, payrollController.previewPayroll);
router.post('/payroll/draft', authenticateToken, requireRole(['admin', 'hr_manager']), payrollController.saveDraftPayroll);
router.post('/payroll/process', authenticateToken, requireRole(['admin', 'hr_manager']), payrollController.processAndSavePayroll);
router.get('/payroll/runs', authenticateToken, payrollController.getPayrollRuns);
router.get('/payroll/runs/:id', authenticateToken, payrollController.getRunDetails);
router.get('/payroll/records/:recordId', authenticateToken, payrollController.getSinglePayslip);

// 6. Statutory Portals & Bank Exports
router.get('/exports/pf-ecr/validate', authenticateToken, exportController.validatePFECR);
router.get('/exports/pf-ecr', authenticateToken, exportController.exportPFECR);
router.get('/exports/esic-excel/validate', authenticateToken, exportController.validateESICExcel);
router.get('/exports/esic-excel', authenticateToken, exportController.exportESICExcel);
router.get('/exports/esic-csv', authenticateToken, exportController.exportESICCSV);
router.get('/exports/bank-neft', authenticateToken, exportController.exportBankNEFT);
router.get('/exports/history', authenticateToken, exportController.getExportHistory);

// 7. Settings & Statutory Rules
router.get('/statutory/rules', statutoryController.getStatutoryRules);
router.put('/statutory/rules', authenticateToken, requireRole(['admin']), statutoryController.updateStatutoryRules);
router.get('/statutory/company', statutoryController.getCompanyProfile);
router.put('/statutory/company', authenticateToken, requireRole(['admin']), statutoryController.updateCompanyProfile);

module.exports = router;
