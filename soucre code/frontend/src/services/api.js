const BASE_URL = '/api';

export async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = options.headers || {};

  const token = localStorage.getItem('auth_token');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return data;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP error ${res.status}`);
  }

  return res.text();
}

// API methods
export const api = {
  // Health
  getHealth: () => request('/health'),

  // Auth
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  signup: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  getCurrentUser: () => request('/auth/me'),
  logout: () => request('/auth/logout', {
    method: 'POST'
  }),

  // Dashboard
  getDashboardStats: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/dashboard/stats${q ? `?${q}` : ''}`);
  },

  // Employees
  getNextEmployeeId: () => request('/employees/generate-id'),
  getEmployees: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/employees${q ? `?${q}` : ''}`);
  },
  getEmployee: (id) => request(`/employees/${id}`),
  createEmployee: (data) => request('/employees', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateEmployee: (id, data) => request(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  toggleEmployeeStatus: (id, status, reason = '') => request(`/employees/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason })
  }),
  deleteEmployee: (id) => request(`/employees/${id}`, {
    method: 'DELETE'
  }),

  // Employee Documents Vault (Authenticated Streaming)
  uploadDocument: (id, formData) => request(`/employees/${id}/documents`, {
    method: 'POST',
    body: formData
  }),
  replaceDocument: (empId, docId, formData) => request(`/employees/${empId}/documents/${docId}/replace`, {
    method: 'PUT',
    body: formData
  }),
  deleteDocument: (empId, docId) => request(`/employees/${empId}/documents/${docId}`, {
    method: 'DELETE'
  }),
  getDocumentViewUrl: (empId, docId) => `/api/employees/${empId}/documents/${docId}/view`,
  getDocumentDownloadUrl: (empId, docId) => `/api/employees/${empId}/documents/${docId}/download`,

  // Attendance
  getAttendance: (month, year) => request(`/attendance?month=${month}&year=${year}`),
  saveAttendance: (month, year, records) => request('/attendance/bulk', {
    method: 'POST',
    body: JSON.stringify({ month, year, records })
  }),

  // Payroll
  previewPayroll: (month, year) => request('/payroll/preview', {
    method: 'POST',
    body: JSON.stringify({ month, year })
  }),
  saveDraftPayroll: (month, year) => request('/payroll/draft', {
    method: 'POST',
    body: JSON.stringify({ month, year })
  }),
  processPayroll: (month, year, options = {}) => request('/payroll/process', {
    method: 'POST',
    body: JSON.stringify({ month, year, ...options })
  }),
  getPayrollRuns: () => request('/payroll/runs'),
  getRunDetails: (id) => request(`/payroll/runs/${id}`),
  getPayslip: (recordId) => request(`/payroll/records/${recordId}`),

  // Statutory & Company
  getRules: () => request('/statutory/rules'),
  updateRules: (data) => request('/statutory/rules', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  getCompany: () => request('/statutory/company'),
  updateCompany: (data) => request('/statutory/company', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // Reports & Statutory Exports
  validatePFECR: (runId) => request(`/exports/pf-ecr/validate?runId=${runId}`),
  validateESICExcel: (runId) => request(`/exports/esic-excel/validate?runId=${runId}`),
  getExportHistory: () => request('/exports/history')
};
