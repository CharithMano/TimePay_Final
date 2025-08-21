import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Handle new backend response format
    if (response.data && response.data.success !== undefined) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // Enhanced error handling
    if (!error.response) {
      // Network error or server is down
      console.error('Network Error:', error.message);
      error.response = {
        data: {
          error: 'Unable to connect to server. Please check if the server is running or your internet connection.'
        }
      };
    } else if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 500) {
      error.response.data = {
        error: error.response.data?.error || 'Internal server error. Please try again later.'
      };
    } else if (error.response?.status === 404) {
      error.response.data = {
        error: error.response.data?.error || 'Resource not found.'
      };
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const employeeAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  getMyProfile: () => api.get('/employees/profile'),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  updateStatus: (id, data) => api.put(`/employees/${id}/status`, data),
  uploadDocument: (id, formData) => 
    api.post(`/employees/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getDocuments: (id) => api.get(`/employees/${id}/documents`),
};

export const attendanceAPI = {
  clockIn: (data) => api.post('/attendance/clock-in', data),
  clockOut: (data) => api.post('/attendance/clock-out', data),
  getMyAttendance: (params) => api.get('/attendance/my-attendance', { params }),
  getTodayAttendance: () => api.get('/attendance/today'),
  getAll: (params) => api.get('/attendance/all', { params }),
  getEmployeeAttendance: (employeeId, params) => 
    api.get(`/attendance/employee/${employeeId}`, { params }),
  markAttendance: (data) => api.post('/attendance/mark', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  getReport: (params) => api.get('/attendance/report', { params }),
  getStats: (params) => api.get('/attendance/stats', { params }),
  getBranchStats: (branchId, params) => api.get(`/attendance/branch/${branchId}/stats`, { params }),
};

export const leaveAPI = {
  apply: (data) => api.post('/leaves/apply', data),
  getMyLeaves: () => api.get('/leaves/my-leaves'),
  getBalance: () => api.get('/leaves/balance'),
  getAll: (params) => api.get('/leaves/all', { params }),
  getPending: () => api.get('/leaves/pending'),
  approve: (id, data) => api.put(`/leaves/${id}/approve`, data),
  reject: (id, data) => api.put(`/leaves/${id}/reject`, data),
  cancel: (id) => api.put(`/leaves/${id}/cancel`),
  getEmployeeLeaves: (employeeId) => api.get(`/leaves/employee/${employeeId}`),
};

export const payrollAPI = {
  generate: (data) => api.post('/payroll/generate', data),
  bulkGenerate: (data) => api.post('/payroll/bulk-generate', data),
  getMyPayslips: () => api.get('/payroll/my-payslips'),
  getPayslip: (id) => api.get(`/payroll/payslip/${id}`),
  getAll: (params) => api.get('/payroll/all', { params }),
  update: (id, data) => api.put(`/payroll/${id}`, data),
  approve: (id, data) => api.put(`/payroll/${id}/approve`, data),
  getEmployeePayrolls: (employeeId) => api.get(`/payroll/employee/${employeeId}`),
  downloadPayslip: (id) => api.get(`/payroll/download/${id}`, { responseType: 'blob' }),
};

export const reportAPI = {
  getEmployeeSummary: () => api.get('/reports/employee-summary'),
  getAttendanceSummary: (params) => api.get('/reports/attendance-summary', { params }),
  getLeaveSummary: (params) => api.get('/reports/leave-summary', { params }),
  getPayrollSummary: (params) => api.get('/reports/payroll-summary', { params }),
  getDepartmentWise: () => api.get('/reports/department-wise'),
  getPerformance: (params) => api.get('/reports/performance', { params }),
  exportEmployees: () => api.get('/reports/export/employees', { responseType: 'blob' }),
  exportAttendance: (params) => api.get('/reports/export/attendance', { 
    params, 
    responseType: 'blob' 
  }),
  exportPayroll: (params) => api.get('/reports/export/payroll', { 
    params, 
    responseType: 'blob' 
  }),
};

export const notificationAPI = {
  getMy: (params) => api.get('/notifications/my-notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
  send: (data) => api.post('/notifications/send', data),
  broadcast: (data) => api.post('/notifications/broadcast', data),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export const roleAPI = {
  getAllUsers: () => api.get('/roles/users'),
  createUser: (data) => api.post('/roles/users', data),
  updateUser: (id, data) => api.put(`/roles/users/${id}`, data),
  deleteUser: (id) => api.delete(`/roles/users/${id}`),
  activateUser: (id) => api.put(`/roles/users/${id}/activate`),
  deactivateUser: (id) => api.put(`/roles/users/${id}/deactivate`),
  updateUserRole: (id, data) => api.put(`/roles/users/${id}/role`, data),
};

export const branchAPI = {
  getAll: () => api.get('/branches'),
  getById: (id) => api.get(`/branches/${id}`),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.put(`/branches/${id}`, data),
  delete: (id) => api.delete(`/branches/${id}`),
  getEmployees: (id) => api.get(`/branches/${id}/employees`),
  getStats: (id) => api.get(`/branches/${id}/stats`),
};

export const paymentAPI = {
  initiate: (data) => api.post('/payments/initiate', data),
  process: (id, data) => api.put(`/payments/${id}/process`, data),
  complete: (id, data) => api.put(`/payments/${id}/complete`, data),
  fail: (id, data) => api.put(`/payments/${id}/fail`, data),
  retry: (id) => api.put(`/payments/${id}/retry`),
  getAll: (params) => api.get('/payments/all', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  getMyPayments: () => api.get('/payments/my-payments'),
  getStats: (params) => api.get('/payments/stats', { params }),
};

export default api;