import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  FileText,
  CheckCircle2,
  XCircle,
  Building2,
  X,
  Save,
  Eye,
  Shield,
  CreditCard,
  Briefcase,
  AlertCircle,
  UserX,
  UserCheck,
  Wand2,
  RefreshCw,
  FileDown,
  ExternalLink,
  Clock,
  Calendar
} from 'lucide-react';
import Badge from '../components/common/Badge';
import SensitiveMask from '../components/common/SensitiveMask';
import Modal from '../components/common/Modal';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { api } from '../services/api';

export default function EmployeeMaster({ onNavigateToDocs }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fetchError, setFetchError] = useState('');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState('personal'); // personal, statutory, salary
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(getInitialFormState());
  const [submitting, setSubmitting] = useState(false);
  const [generatingId, setGeneratingId] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Deactivate / Activate Action Modal
  const [statusModal, setStatusModal] = useState({ open: false, emp: null, reason: '' });
  const [statusToggling, setStatusToggling] = useState(false);

  // Profile Drawer / View Modal
  const [viewingEmp, setViewingEmp] = useState(null);
  const [viewingEmpDocs, setViewingEmpDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  function getInitialFormState() {
    return {
      emp_code: '',
      full_name: '',
      gender: 'Male',
      dob: '1992-05-15',
      joining_date: '2023-01-10',
      designation: '',
      department: 'Production',
      phone: '',
      email: '',
      bank_name: 'State Bank of India',
      bank_account: '',
      ifsc: '',
      pan: '',
      aadhaar: '',
      uan: '',
      esic_ip: '',
      pf_opt_out: false,
      esic_opt_out: false,
      active: true,
      basic_wage: 12000,
      dearness_allowance: 2000,
      house_rent_allowance: 3000,
      conveyance_allowance: 1000,
      medical_allowance: 500,
      special_allowance: 500
    };
  }

  useEffect(() => {
    fetchEmployees();
  }, [search, department, statusFilter]);

  useEffect(() => {
    if (viewingEmp) {
      loadEmployeeDocs(viewingEmp.id);
    } else {
      setViewingEmpDocs([]);
    }
  }, [viewingEmp]);

  const loadEmployeeDocs = async (empId) => {
    setLoadingDocs(true);
    try {
      const res = await api.getEmployee(empId);
      if (res && res.data) {
        setViewingEmpDocs(res.data.documents || []);
      }
    } catch (err) {
      console.error('Failed to load employee documents', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await api.getEmployees({
        search: search || undefined,
        department: department !== 'All' ? department : undefined,
        active: statusFilter !== 'All' ? statusFilter : undefined
      });
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Failed to load employees:', err);
      setFetchError(err.message || 'Unable to connect to database. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = async () => {
    setEditingId(null);
    setFormData(getInitialFormState());
    setModalTab('personal');
    setErrorMsg('');
    setShowModal(true);

    // Auto-generate next employee ID
    setGeneratingId(true);
    try {
      const res = await api.getNextEmployeeId();
      if (res && res.nextCode) {
        setFormData((prev) => ({ ...prev, emp_code: res.nextCode }));
      }
    } catch (err) {
      console.error('Failed to auto-generate code', err);
    } finally {
      setGeneratingId(false);
    }
  };

  const handleOpenCreate = handleOpenAdd;

  const handleGenerateId = async () => {
    setGeneratingId(true);
    try {
      const res = await api.getNextEmployeeId();
      if (res && res.nextCode) {
        setFormData((prev) => ({ ...prev, emp_code: res.nextCode }));
      }
    } catch (err) {
      alert(`Could not generate next code: ${err.message}`);
    } finally {
      setGeneratingId(false);
    }
  };

  const handleOpenEdit = (emp) => {
    setEditingId(emp.id);
    setFormData({
      emp_code: emp.emp_code,
      full_name: emp.full_name,
      gender: emp.gender || 'Male',
      dob: emp.dob || '',
      joining_date: emp.joining_date || '',
      designation: emp.designation || '',
      department: emp.department || 'Production',
      phone: emp.phone || '',
      email: emp.email || '',
      bank_name: emp.bank_name || '',
      bank_account: emp.bank_account || '',
      ifsc: emp.ifsc || '',
      pan: emp.pan || '',
      aadhaar: emp.aadhaar || '',
      uan: emp.uan || '',
      esic_ip: emp.esic_ip || '',
      pf_opt_out: Boolean(emp.pf_opt_out),
      esic_opt_out: Boolean(emp.esic_opt_out),
      active: Boolean(emp.active),
      basic_wage: emp.basic_wage || 0,
      dearness_allowance: emp.dearness_allowance || 0,
      house_rent_allowance: emp.house_rent_allowance || 0,
      conveyance_allowance: emp.conveyance_allowance || 0,
      medical_allowance: emp.medical_allowance || 0,
      special_allowance: emp.special_allowance || 0
    });
    setModalTab('personal');
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenStatusToggle = (emp) => {
    setStatusModal({
      open: true,
      emp,
      reason: emp.deactivation_reason || ''
    });
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusModal.emp) return;
    setStatusToggling(true);
    try {
      const newStatus = !statusModal.emp.active;
      await api.toggleEmployeeStatus(statusModal.emp.id, newStatus, statusModal.reason);
      setStatusModal({ open: false, emp: null, reason: '' });
      fetchEmployees();
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setStatusToggling(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete employee ${name}? This will remove associated records.`)) return;
    try {
      await api.deleteEmployee(id);
      fetchEmployees();
    } catch (err) {
      alert(`Error deleting: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      if (editingId) {
        await api.updateEmployee(editingId, formData);
      } else {
        await api.createEmployee(formData);
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const computedGross = Number(formData.basic_wage || 0) +
                        Number(formData.dearness_allowance || 0) +
                        Number(formData.house_rent_allowance || 0) +
                        Number(formData.conveyance_allowance || 0) +
                        Number(formData.medical_allowance || 0) +
                        Number(formData.special_allowance || 0);

  return (
    <div className="space-y-6">
      {/* Search & Actions Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search code, name, UAN, ESIC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 text-xs"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="text-xs"
            >
              <option value="All">All Departments</option>
              <option value="Production">Production</option>
              <option value="Quality">Quality</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Logistics">Logistics</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Administration">Administration</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs"
          >
            <option value="All">All Status</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Employees Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            <CardTitle>Employee Master Register</CardTitle>
          </div>
          <CardDescription>
            {employees.length} employees found • Masked sensitive identifiers (click eye to reveal)
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Employee ID & Name</th>
                <th className="py-3 px-4">Department & Designation</th>
                <th className="py-3 px-4">Date of Joining</th>
                <th className="py-3 px-4">UAN (EPFO)</th>
                <th className="py-3 px-4">ESIC / IP Number</th>
                <th className="py-3 px-4">Fixed Monthly Gross</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                      Loading employee directory...
                    </div>
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <div className="max-w-md mx-auto p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                      <AlertCircle className="w-5 h-5 mx-auto mb-2 text-rose-600" />
                      <div className="font-semibold mb-1">Failed to load employee records</div>
                      <div className="text-slate-500 mb-3">{fetchError}</div>
                      <button
                        onClick={fetchEmployees}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retry Connection
                      </button>
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {search || department !== 'All' || statusFilter !== 'All'
                          ? 'No matching employees found'
                          : 'No employees registered yet'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                        {search || department !== 'All' || statusFilter !== 'All'
                          ? 'Try adjusting your search terms or filters.'
                          : 'Click Add Employee to register your first employee in MongoDB.'}
                      </p>
                      <button
                        onClick={handleOpenAdd}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Employee
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-sm">{emp.full_name}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{emp.emp_code} • {emp.gender}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{emp.department}</div>
                      <div className="text-slate-500 text-[11px]">{emp.designation || 'Staff'}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {emp.joining_date || '2023-01-10'}
                    </td>

                    <td className="py-3 px-4">
                      {emp.uan ? (
                        <SensitiveMask value={emp.uan} type="generic" />
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {emp.esic_ip ? (
                        <SensitiveMask value={emp.esic_ip} type="generic" />
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">Exempt / NA</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-900 text-sm">
                        ₹{Number(emp.monthly_gross || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        Basic: ₹{Number(emp.basic_wage || 0).toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Badge variant={emp.active ? 'success' : 'danger'} size="xs">
                        {emp.active ? 'Active' : 'Inactive'}
                      </Badge>
                      {!emp.active && emp.deactivation_reason && (
                        <div className="text-[9px] text-rose-500 mt-0.5 truncate max-w-[90px] mx-auto" title={emp.deactivation_reason}>
                          {emp.deactivation_reason}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => setViewingEmp(emp)}
                        className="p-1.5 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="View Full Profile & Documents"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onNavigateToDocs && onNavigateToDocs(emp.id)}
                        className="p-1.5 rounded text-sky-600 hover:text-sky-700 hover:bg-sky-50 transition-colors"
                        title="Document Vault"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Edit Record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenStatusToggle(emp)}
                        className={`p-1.5 rounded transition-colors ${
                          emp.active
                            ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                            : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                        }`}
                        title={emp.active ? 'Deactivate Employee Record' : 'Reactivate Employee Record'}
                      >
                        {emp.active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id, emp.full_name)}
                        className="p-1.5 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Delete Worker Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Employee Modal with Tabs */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Employee Record' : 'Register New Employee'}
        subtitle="Fields marked with an asterisk (*) are mandatory for statutory payroll processing."
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex border-b border-slate-200 gap-4 font-semibold text-xs pb-1">
            <button
              type="button"
              onClick={() => setModalTab('personal')}
              className={`pb-2 transition-colors ${
                modalTab === 'personal'
                  ? 'text-sky-700 border-b-2 border-sky-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              1. Personal & Employment
            </button>
            <button
              type="button"
              onClick={() => setModalTab('statutory')}
              className={`pb-2 transition-colors ${
                modalTab === 'statutory'
                  ? 'text-sky-700 border-b-2 border-sky-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              2. EPFO, ESIC & Banking
            </button>
            <button
              type="button"
              onClick={() => setModalTab('salary')}
              className={`pb-2 transition-colors ${
                modalTab === 'salary'
                  ? 'text-sky-700 border-b-2 border-sky-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              3. Salary Package Structure
            </button>
          </div>

          {/* Tab 1: Personal & Employment */}
          {modalTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-medium">
                      Employee ID / Code <span className="text-rose-500">*</span>
                    </label>
                    {!editingId && (
                      <button
                        type="button"
                        onClick={handleGenerateId}
                        disabled={generatingId}
                        className="text-[10px] text-sky-600 hover:text-sky-800 font-medium flex items-center gap-1"
                        title="Auto-generate next sequential code"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${generatingId ? 'animate-spin' : ''}`} />
                        Auto-Gen
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.emp_code}
                      onChange={(e) => setFormData({ ...formData, emp_code: e.target.value.toUpperCase() })}
                      placeholder="e.g. EMP007"
                      className="w-full font-mono uppercase pr-8"
                    />
                    {!editingId && (
                      <button
                        type="button"
                        onClick={handleGenerateId}
                        disabled={generatingId}
                        className="absolute right-2 top-2 text-slate-400 hover:text-sky-600 p-0.5"
                        title="Generate next sequential EMP ID"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-medium block mb-1">
                    Full Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar Verma"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Date of Joining</label>
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full"
                  >
                    <option value="Production">Production</option>
                    <option value="Quality">Quality</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. CNC Machine Operator"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Employment Status</label>
                  <select
                    value={formData.active ? '1' : '0'}
                    onChange={(e) => setFormData({ ...formData, active: e.target.value === '1' })}
                    className="w-full"
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive / On Leave</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9811223344"
                    className="w-full"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-medium block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ramesh@company.com"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Statutory & Banking */}
          {modalTab === 'statutory' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">
                    12-digit UAN (EPFO Universal Account No)
                  </label>
                  <input
                    type="text"
                    maxLength="12"
                    value={formData.uan}
                    onChange={(e) => setFormData({ ...formData, uan: e.target.value })}
                    placeholder="101234567890"
                    className="w-full font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Mandatory for PF deduction & ECR export</span>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">
                    10-digit ESIC IP (Insurance Person) No
                  </label>
                  <input
                    type="text"
                    maxLength="10"
                    value={formData.esic_ip}
                    onChange={(e) => setFormData({ ...formData, esic_ip: e.target.value })}
                    placeholder="2012345678"
                    className="w-full font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Required if monthly gross &le; ₹21,000</span>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">PAN Card Number</label>
                  <input
                    type="text"
                    maxLength="10"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    placeholder="ABCDE1234F"
                    className="w-full font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">12-digit Aadhaar Number</label>
                  <input
                    type="text"
                    maxLength="12"
                    value={formData.aadhaar}
                    onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
                    placeholder="987654321098"
                    className="w-full font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="State Bank of India"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={formData.bank_account}
                    onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                    placeholder="30291827364"
                    className="w-full font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-medium block mb-1">Bank IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifsc}
                    onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                    placeholder="SBIN0001234"
                    className="w-full font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Salary Package */}
          {modalTab === 'salary' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-medium">Computed Monthly Gross:</span>
                  <div className="text-lg font-bold text-slate-900 font-mono">
                    ₹{computedGross.toFixed(2)}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <span>PF Eligible Wage Base: <strong>₹{Math.min(15000, Number(formData.basic_wage) + Number(formData.dearness_allowance)).toFixed(2)}</strong></span>
                  <br />
                  <span>ESIC Status: <strong>{computedGross <= 21000 ? 'Covered (<= ₹21k)' : 'Exempt (> ₹21k)'}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                <div>
                  <label className="text-slate-700 font-sans font-medium block mb-1">
                    Basic Wage (INR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.basic_wage}
                    onChange={(e) => setFormData({ ...formData, basic_wage: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-sans font-medium block mb-1">
                    Dearness Allowance (DA)
                  </label>
                  <input
                    type="number"
                    value={formData.dearness_allowance}
                    onChange={(e) => setFormData({ ...formData, dearness_allowance: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-sans font-medium block mb-1">
                    House Rent Allowance (HRA)
                  </label>
                  <input
                    type="number"
                    value={formData.house_rent_allowance}
                    onChange={(e) => setFormData({ ...formData, house_rent_allowance: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-sans font-medium block mb-1">
                    Conveyance Allowance
                  </label>
                  <input
                    type="number"
                    value={formData.conveyance_allowance}
                    onChange={(e) => setFormData({ ...formData, conveyance_allowance: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-sans font-medium block mb-1">
                    Medical Allowance
                  </label>
                  <input
                    type="number"
                    value={formData.medical_allowance}
                    onChange={(e) => setFormData({ ...formData, medical_allowance: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-sans font-medium block mb-1">
                    Special Allowance
                  </label>
                  <input
                    type="number"
                    value={formData.special_allowance}
                    onChange={(e) => setFormData({ ...formData, special_allowance: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="text-[11px] text-slate-400">
              {editingId ? `Editing ID #${editingId}` : 'New Registration'}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3.5 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {submitting ? 'Saving...' : editingId ? 'Update Employee' : 'Create Record'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Employee Profile View Dialog */}
      {viewingEmp && (
        <Modal
          isOpen={Boolean(viewingEmp)}
          onClose={() => setViewingEmp(null)}
          title={`Employee Profile — ${viewingEmp.full_name}`}
          subtitle={`Employee Code: ${viewingEmp.emp_code} • Department: ${viewingEmp.department}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-slate-500 block mb-0.5">Designation:</span>
                <strong className="text-slate-900">{viewingEmp.designation || 'Staff'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Joining Date:</span>
                <span className="font-mono text-slate-800">{viewingEmp.joining_date || '2023-01-10'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Gender:</span>
                <span className="text-slate-800">{viewingEmp.gender || 'Male'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Status:</span>
                <Badge variant={viewingEmp.active ? 'success' : 'danger'} size="xs">
                  {viewingEmp.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 uppercase text-[11px] mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-600" />
                Statutory Identifiers
              </h4>
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-md border border-slate-100">
                <div>
                  <span className="text-slate-500 block text-[10px]">12-digit EPFO UAN:</span>
                  <SensitiveMask value={viewingEmp.uan} type="generic" />
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">10-digit ESIC IP No:</span>
                  <SensitiveMask value={viewingEmp.esic_ip} type="generic" />
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">PAN Card:</span>
                  <SensitiveMask value={viewingEmp.pan} type="pan" />
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Aadhaar:</span>
                  <SensitiveMask value={viewingEmp.aadhaar} type="aadhaar" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 uppercase text-[11px] mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                Banking Details
              </h4>
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-md border border-slate-100">
                <div>
                  <span className="text-slate-500 block text-[10px]">Bank Name:</span>
                  <span className="font-semibold text-slate-800">{viewingEmp.bank_name || 'State Bank of India'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Account Number:</span>
                  <SensitiveMask value={viewingEmp.bank_account} type="bank" />
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">IFSC Code:</span>
                  <span className="font-mono text-slate-800">{viewingEmp.ifsc || 'SBIN0001234'}</span>
                </div>
              </div>
            </div>

            {/* Deactivation Audit Details */}
            {!viewingEmp.active && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md">
                <div className="flex items-center gap-1.5 text-rose-700 font-semibold mb-1">
                  <UserX className="w-3.5 h-3.5" />
                  Deactivated Record
                </div>
                <div className="text-slate-600 text-[11px] space-y-0.5">
                  <div>Reason: <strong className="text-slate-800">{viewingEmp.deactivation_reason || 'Administrative Deactivation'}</strong></div>
                  {viewingEmp.deactivated_at && (
                    <div>Timestamp: <span className="font-mono text-slate-700">{new Date(viewingEmp.deactivated_at).toLocaleString()}</span></div>
                  )}
                </div>
              </div>
            )}

            {/* Verified KYC & Statutory Documents Vault */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-800 uppercase text-[11px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-600" />
                  Statutory KYC & Employment Documents ({viewingEmpDocs.length})
                </h4>
                {onNavigateToDocs && (
                  <button
                    onClick={() => {
                      const id = viewingEmp.id;
                      setViewingEmp(null);
                      onNavigateToDocs(id);
                    }}
                    className="text-[10px] text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1"
                  >
                    Manage Vault
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              {loadingDocs ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-md border border-slate-100">
                  Loading secure document records...
                </div>
              ) : viewingEmpDocs.length === 0 ? (
                <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-md border border-dashed border-slate-200">
                  No statutory documents on file. Click "Manage Vault" to upload Aadhaar, PAN, or E-Pehchan PDF.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 bg-slate-50 rounded-md border border-slate-200 overflow-hidden">
                  {viewingEmpDocs.map((doc) => (
                    <div key={doc.id} className="p-2.5 flex items-center justify-between hover:bg-slate-100/60 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-sky-100 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-[11px]">{doc.doc_type}</div>
                          <div className="text-[10px] text-slate-500">
                            {doc.doc_number ? `ID: ${doc.doc_number} • ` : ''}
                            {doc.file_name} • {(doc.file_size / 1024).toFixed(1)} KB
                          </div>
                          {doc.expiry_date && (
                            <div className="text-[9px] text-amber-600">Expires: {doc.expiry_date}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={api.getDocumentViewUrl(viewingEmp.id, doc.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-semibold flex items-center gap-1 shadow-2xs"
                          title="Stream inline view in browser"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </a>
                        <a
                          href={api.getDocumentDownloadUrl(viewingEmp.id, doc.id)}
                          download
                          className="px-2 py-1 rounded bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-700 text-[10px] font-semibold flex items-center gap-1 shadow-2xs"
                          title="Download document file"
                        >
                          <FileDown className="w-3 h-3" />
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewingEmp(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Deactivate / Activate Confirmation Modal */}
      {statusModal.open && statusModal.emp && (
        <Modal
          isOpen={statusModal.open}
          onClose={() => setStatusModal({ open: false, emp: null, reason: '' })}
          title={statusModal.emp.active ? 'Deactivate Employee Record' : 'Reactivate Employee Record'}
          subtitle={`Employee: ${statusModal.emp.full_name} (${statusModal.emp.emp_code})`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            {statusModal.emp.active ? (
              <>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
                  <div className="font-semibold mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Notice regarding deactivation:
                  </div>
                  Deactivating this employee preserves all past payroll runs, statutory filings (PF/ESIC), and document history, but excludes them from future monthly payroll calculations.
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Deactivation Reason <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={statusModal.reason}
                    onChange={(e) => setStatusModal({ ...statusModal, reason: e.target.value })}
                    className="w-full mb-2"
                  >
                    <option value="">Select reason...</option>
                    <option value="Resignation Accepted">Resignation Accepted</option>
                    <option value="Contract Period Completed">Contract Period Completed</option>
                    <option value="Superannuation / Retired">Superannuation / Retired</option>
                    <option value="Medical Incapacity">Medical Incapacity</option>
                    <option value="Absconded / Abandoned Service">Absconded / Abandoned Service</option>
                    <option value="Other Administrative Separation">Other Administrative Separation</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Or enter custom deactivation notes..."
                    value={statusModal.reason}
                    onChange={(e) => setStatusModal({ ...statusModal, reason: e.target.value })}
                    className="w-full"
                  />
                </div>
              </>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800">
                <div className="font-semibold mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Restore Active Employment Status
                </div>
                Reactivating will restore this employee's active eligibility in the current payroll cycle and statutory compliance calculations.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatusModal({ open: false, emp: null, reason: '' })}
                className="px-3.5 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusToggle}
                disabled={statusToggling || (statusModal.emp.active && !statusModal.reason.trim())}
                className={`px-4 py-1.5 rounded-md text-white font-semibold shadow-xs flex items-center gap-1.5 ${
                  statusModal.emp.active
                    ? 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {statusToggling ? (
                  'Updating...'
                ) : statusModal.emp.active ? (
                  <>
                    <UserX className="w-3.5 h-3.5" />
                    Confirm Deactivation
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    Confirm Reactivation
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
