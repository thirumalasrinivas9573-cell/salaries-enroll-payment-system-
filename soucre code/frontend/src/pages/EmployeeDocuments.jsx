import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
  Eye,
  FileCheck,
  ShieldCheck,
  Download,
  RefreshCw,
  Calendar,
  Clock,
  ExternalLink,
  ShieldAlert,
  FileSpreadsheet
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { api } from '../services/api';

const DOCUMENT_CATEGORIES = [
  'ESIC E-Pehchan Card (PDF)',
  'Aadhaar Card (UIDAI)',
  'PAN Card (Income Tax)',
  'Bank Passbook / Cancelled Cheque',
  'Appointment / Employment Contract',
  'EPFO Declaration (Form 11)',
  'ESIC Declaration (Form 1)',
  'Medical Fitness Certificate',
  'Identity Proof / Voter ID',
  'Educational / Trade Certificate'
];

export default function EmployeeDocuments({ initialEmployeeId }) {
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState(initialEmployeeId || '');
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload Form State
  const [docType, setDocType] = useState('ESIC E-Pehchan Card (PDF)');
  const [docNumber, setDocNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Replace Document Modal State
  const [replaceModal, setReplaceModal] = useState({ open: false, doc: null });
  const [replaceFile, setReplaceFile] = useState(null);
  const [replaceDocNumber, setReplaceDocNumber] = useState('');
  const [replaceExpiryDate, setReplaceExpiryDate] = useState('');
  const [replacing, setReplacing] = useState(false);
  const [replaceMsg, setReplaceMsg] = useState('');

  useEffect(() => {
    fetchEmployeesList();
  }, []);

  useEffect(() => {
    if (initialEmployeeId) {
      setSelectedEmpId(initialEmployeeId);
    }
  }, [initialEmployeeId]);

  useEffect(() => {
    if (selectedEmpId) {
      fetchEmployeeDocs(selectedEmpId);
    }
  }, [selectedEmpId]);

  const fetchEmployeesList = async () => {
    try {
      const res = await api.getEmployees();
      const list = res.data || [];
      setEmployees(list);
      if (!selectedEmpId && list.length > 0) {
        setSelectedEmpId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load employee list', err);
    }
  };

  const fetchEmployeeDocs = async (id) => {
    setLoading(true);
    try {
      const res = await api.getEmployee(id);
      setEmployeeDetails(res.data);
    } catch (err) {
      console.error('Failed to load employee details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMsg({ text: 'Please select a document file to upload.', type: 'error' });
      return;
    }

    setUploading(true);
    setMsg({ text: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('doc_type', docType);
      if (docNumber.trim()) formData.append('doc_number', docNumber.trim());
      if (expiryDate) formData.append('expiry_date', expiryDate);

      await api.uploadDocument(selectedEmpId, formData);
      setMsg({ text: `Document '${docType}' securely uploaded and verified!`, type: 'success' });
      setFile(null);
      setDocNumber('');
      setExpiryDate('');
      // Reset file input element
      const fileInput = document.getElementById('doc-file-input');
      if (fileInput) fileInput.value = '';

      fetchEmployeeDocs(selectedEmpId);
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleOpenReplace = (doc) => {
    setReplaceModal({ open: true, doc });
    setReplaceFile(null);
    setReplaceDocNumber(doc.doc_number || '');
    setReplaceExpiryDate(doc.expiry_date || '');
    setReplaceMsg('');
  };

  const handleConfirmReplace = async (e) => {
    e.preventDefault();
    if (!replaceFile) {
      setReplaceMsg('Please select a replacement file.');
      return;
    }

    setReplacing(true);
    setReplaceMsg('');

    try {
      const formData = new FormData();
      formData.append('document', replaceFile);
      if (replaceDocNumber.trim()) formData.append('doc_number', replaceDocNumber.trim());
      if (replaceExpiryDate) formData.append('expiry_date', replaceExpiryDate);

      await api.replaceDocument(selectedEmpId, replaceModal.doc.id, formData);
      setReplaceModal({ open: false, doc: null });
      setMsg({ text: `Document '${replaceModal.doc.doc_type}' replaced successfully!`, type: 'success' });
      fetchEmployeeDocs(selectedEmpId);
    } catch (err) {
      setReplaceMsg(err.message);
    } finally {
      setReplacing(false);
    }
  };

  const handleDeleteDoc = async (docId, docType) => {
    if (!window.confirm(`Are you sure you want to delete '${docType}'? This action cannot be undone.`)) return;
    try {
      await api.deleteDocument(selectedEmpId, docId);
      setMsg({ text: `Document removed from vault.`, type: 'success' });
      fetchEmployeeDocs(selectedEmpId);
    } catch (err) {
      alert(`Error deleting document: ${err.message}`);
    }
  };

  const getExpiryBadge = (expiryStr) => {
    if (!expiryStr) return null;
    const now = new Date();
    const expiry = new Date(expiryStr);
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Badge variant="danger" size="xs">Expired ({expiryStr})</Badge>;
    }
    if (diffDays <= 30) {
      return <Badge variant="warning" size="xs">Expires in {diffDays}d</Badge>;
    }
    return <Badge variant="success" size="xs">Valid (until {expiryStr})</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Top Selector Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
            Statutory Employee Document Vault
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Encrypted storage for ESIC E-Pehchan cards, EPFO Form 11 declarations, Aadhaar, PAN and banking proofs.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Users className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="w-full sm:w-72 text-xs font-medium"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.emp_code} — {emp.full_name} ({emp.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Employee Summary Bar */}
      {employeeDetails && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400 block text-[10px]">EMPLOYEE</span>
              <strong className="text-slate-900 font-semibold">{employeeDetails.full_name}</strong>
              <span className="text-slate-500 font-mono text-[11px] ml-1.5">({employeeDetails.emp_code})</span>
            </div>
            <div className="hidden md:block h-6 w-px bg-slate-200" />
            <div className="hidden md:block">
              <span className="text-slate-400 block text-[10px]">EPFO UAN</span>
              <span className="font-mono text-slate-800 font-medium">{employeeDetails.uan || 'Not Assigned'}</span>
            </div>
            <div className="hidden md:block h-6 w-px bg-slate-200" />
            <div className="hidden md:block">
              <span className="text-slate-400 block text-[10px]">ESIC IP NUMBER</span>
              <span className="font-mono text-slate-800 font-medium">{employeeDetails.esic_ip || 'Exempt / NA'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">
              Vault Documents: <strong>{employeeDetails.documents?.length || 0}</strong>
            </span>
            <Badge variant={employeeDetails.active ? 'success' : 'danger'} size="xs">
              {employeeDetails.active ? 'Active Employee' : 'Inactive'}
            </Badge>
          </div>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form Card (Left Column) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-sky-600" />
              <CardTitle>Upload Document</CardTitle>
            </div>
            <CardDescription>
              Allowed: PDF, PNG, JPEG (Max 5MB). Files are streamed securely.
            </CardDescription>
          </CardHeader>

          <div className="p-5 pt-0">
            {msg.text && (
              <div
                className={`p-3 rounded-md mb-4 text-xs font-medium flex items-center gap-2 ${
                  msg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{msg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">
                  Document Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full"
                >
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">
                  Document / Certificate Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1234-5678-9012 or E-Pehchan IP"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">
                  Document Expiry Date (When Applicable)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Useful for medical certificates, insurance cards & contracts.
                </span>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">
                  Select File <span className="text-rose-500">*</span>
                </label>
                <input
                  id="doc-file-input"
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-300 file:text-xs file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
                />
                {file && (
                  <div className="mt-1.5 text-[11px] text-slate-500 flex items-center justify-between">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <span className="font-mono">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="w-full py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Encrypting & Storing...' : 'Upload to Secure Vault'}
                </button>
              </div>

              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Vault documents are stored in server-protected storage and can only be accessed by authenticated administrators.
                </span>
              </div>
            </form>
          </div>
        </Card>

        {/* Existing Documents Vault Table (Right Column) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-slate-700" />
                <CardTitle>Vault Records ({employeeDetails?.documents?.length || 0})</CardTitle>
              </div>
              <button
                onClick={() => fetchEmployeeDocs(selectedEmpId)}
                className="text-xs text-sky-600 hover:text-sky-800 font-medium flex items-center gap-1"
                title="Refresh documents list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <CardDescription>
              Download, view in browser, replace or remove employee documents.
            </CardDescription>
          </CardHeader>

          <div className="p-0">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Loading encrypted vault documents...
              </div>
            ) : !employeeDetails?.documents || employeeDetails.documents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No documents uploaded yet for {employeeDetails?.full_name || 'this employee'}.
                <div className="mt-1 text-slate-400">
                  Upload an E-Pehchan card PDF, Aadhaar, PAN or appointment letter on the left.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-2.5 px-4">Document Details</th>
                      <th className="py-2.5 px-3">Upload Date</th>
                      <th className="py-2.5 px-3">Expiry Date</th>
                      <th className="py-2.5 px-3">File Size</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employeeDetails.documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-sky-600" />
                            {doc.doc_type}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {doc.doc_number ? `No: ${doc.doc_number} • ` : ''}
                            {doc.file_name}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                          {doc.uploaded_at ? doc.uploaded_at.split(' ')[0] : '—'}
                        </td>

                        <td className="py-3 px-3">
                          {doc.expiry_date ? (
                            getExpiryBadge(doc.expiry_date)
                          ) : (
                            <span className="text-slate-400 text-[11px]">No Expiry</span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                          {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : '—'}
                        </td>

                        <td className="py-3 px-4 text-right space-x-1">
                          <a
                            href={api.getDocumentViewUrl(selectedEmpId, doc.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Stream Inline View (PDF / Image)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={api.getDocumentDownloadUrl(selectedEmpId, doc.id)}
                            download
                            className="inline-flex p-1.5 rounded text-sky-600 hover:text-sky-800 hover:bg-sky-50 transition-colors"
                            title="Download Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleOpenReplace(doc)}
                            className="p-1.5 rounded text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                            title="Replace Document File"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDoc(doc.id, doc.doc_type)}
                            className="p-1.5 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Replace Document Modal */}
      {replaceModal.open && replaceModal.doc && (
        <Modal
          isOpen={replaceModal.open}
          onClose={() => setReplaceModal({ open: false, doc: null })}
          title={`Replace Document — ${replaceModal.doc.doc_type}`}
          subtitle={`Employee: ${employeeDetails?.full_name} (${employeeDetails?.emp_code})`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmReplace} className="space-y-4 text-xs">
            {replaceMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{replaceMsg}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-600">
              <span className="text-slate-400 block text-[10px]">CURRENT FILE</span>
              <strong className="text-slate-800">{replaceModal.doc.file_name}</strong>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Uploaded: {replaceModal.doc.uploaded_at || 'Earlier'}
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">
                Select Replacement File <span className="text-rose-500">*</span>
              </label>
              <input
                type="file"
                required
                accept=".pdf,image/png,image/jpeg,image/jpg"
                onChange={(e) => setReplaceFile(e.target.files[0])}
                className="w-full text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-300 file:text-xs file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">
                Updated Document / Certificate Number (Optional)
              </label>
              <input
                type="text"
                value={replaceDocNumber}
                onChange={(e) => setReplaceDocNumber(e.target.value)}
                placeholder="Leave blank to keep existing number"
                className="w-full font-mono"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">
                Updated Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={replaceExpiryDate}
                onChange={(e) => setReplaceExpiryDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReplaceModal({ open: false, doc: null })}
                className="px-3.5 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={replacing || !replaceFile}
                className="px-4 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${replacing ? 'animate-spin' : ''}`} />
                {replacing ? 'Replacing File...' : 'Confirm & Replace'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
