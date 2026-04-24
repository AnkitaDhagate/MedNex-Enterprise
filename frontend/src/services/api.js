// src/services/api.js — FIXED
import axios from 'axios';

// ============================================================
// Axios instance
// FIX: baseURL must match backend:
//   - server.port = 8082
//   - server.servlet.context-path = /api
//   So correct base is: http://localhost:8082/api
//   All endpoint calls like /patients, /appointments are appended to this.
// ============================================================
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8082/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Request interceptor: attach JWT + X-Tenant-ID ──────────────
api.interceptors.request.use(
  (config) => {
    const token    = localStorage.getItem('mednex_token');
    const user     = tokenHelper.getUser();
    const tenantId = user?.tenantId
      || localStorage.getItem('mednex_tenant')
      || 'HOSP_A';

    if (token) config.headers.Authorization = `Bearer ${token}`;

    // FIX: Always send X-Tenant-ID header — TenantFilter requires it
    config.headers['X-Tenant-ID'] = tenantId;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: global 401 handler ──────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenHelper.clear();
      localStorage.removeItem('mednex_tenant');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// Auth API
// ============================================================
export const authAPI = {
  login: async (username, password, tenantId) => {
    const response = await api.post('/auth/login', { username, password, tenantId });
    return response.data;
  },

  register: async (formData) => {
    const response = await api.post('/auth/register', {
      username:    formData.username,
      password:    formData.password,
      email:       formData.email,
      firstName:   formData.firstName,
      lastName:    formData.lastName,
      tenantId:    formData.tenantId,
      phone:       formData.phone       || '',
      department:  formData.department  || '',
      designation: formData.designation || '',
      roleName:    formData.roleName    || 'NURSE',
    });
    return response.data;
  },

  validateToken: async () => {
    const response = await api.post('/auth/validate');
    return response.data;
  },

  health: async () => {
    const response = await api.get('/auth/health');
    return response.data;
  },

  logout: async () => {
    // Stateless JWT — just resolve. Local state cleared by caller.
    return Promise.resolve({ success: true });
  },
};

// ============================================================
// Patient API
// ============================================================
export const patientAPI = {
  getAll:    async ()         => api.get('/patients'),
  getById:   async (id)       => api.get(`/patients/${id}`),
  create:    async (data)     => api.post('/patients', data),
  update:    async (id, data) => api.put(`/patients/${id}`, data),
  delete:    async (id)       => api.delete(`/patients/${id}`),
  search:    async (query)    => api.get(`/patients/search?q=${encodeURIComponent(query)}`),
  getRecent: async ()         => api.get('/patients/recent'),
};

// ============================================================
// Appointment API
// ============================================================
export const appointmentAPI = {
  getAll:   async ()         => api.get('/appointments'),
  getById:  async (id)       => api.get(`/appointments/${id}`),
  create:   async (data)     => api.post('/appointments', data),
  update:   async (id, data) => api.put(`/appointments/${id}`, data),
  delete:   async (id)       => api.delete(`/appointments/${id}`),
  cancel:   async (id)       => api.patch(`/appointments/${id}/cancel`),

  getByDoctor: async (doctorId, date) => {
    const url = date
      ? `/appointments/doctor/${doctorId}?date=${date}`
      : `/appointments/doctor/${doctorId}`;
    return api.get(url);
  },

  getByPatient: async (patientId) => api.get(`/appointments/patient/${patientId}`),
  getByDate:    async (date)       => api.get(`/appointments/date/${date}`),
};

// ============================================================
// Medical Record API
// ============================================================
export const medicalRecordAPI = {
  getAll:       async ()          => api.get('/medical-records'),
  getById:      async (id)        => api.get(`/medical-records/${id}`),
  getByPatient: async (patientId) => api.get(`/medical-records/patient/${patientId}`),
  create:       async (data)      => api.post('/medical-records', data),
  update:       async (id, data)  => api.put(`/medical-records/${id}`, data),
  delete:       async (id)        => api.delete(`/medical-records/${id}`),
};

// ============================================================
// Analytics API
// ============================================================
export const analyticsAPI = {
  getBedOccupancy:    async () => api.get('/analytics/bed-occupancy'),
  getTrend:           async () => api.get('/analytics/trend'),
  getSummary:         async () => api.get('/analytics/summary'),
  getDepartmentStats: async () => api.get('/analytics/departments'),
};

// ============================================================
// Export API (PDF download)
// ============================================================
export const exportAPI = {
  exportPatientPDF:       async (patientId)     => api.get(`/export/patient/${patientId}`,       { responseType: 'blob' }),
  exportMedicalRecordPDF: async (recordId)      => api.get(`/export/record/${recordId}`,         { responseType: 'blob' }),
  exportAppointmentPDF:   async (appointmentId) => api.get(`/export/appointment/${appointmentId}`,{ responseType: 'blob' }),
};

// ============================================================
// Audit API
// ============================================================
export const auditAPI = {
  getLogs:         async (page = 0, size = 200) => api.get(`/audit/logs?page=${page}&size=${size}`),
  getLogsByUser:   async (userId)               => api.get(`/audit/logs/user/${userId}`),
  getLogsByEntity: async (entityType, entityId) => api.get(`/audit/logs/entity/${entityType}/${entityId}`),
};

// ============================================================
// Dashboard API
// ============================================================
export const dashboardAPI = {
  getStats:              async () => api.get('/dashboard/stats'),
  getRecentPatients:     async () => api.get('/dashboard/recent-patients'),
  getRecentAppointments: async () => api.get('/dashboard/recent-appointments'),
  getBedOccupancy:       async () => api.get('/dashboard/bed-occupancy'),
};

// ============================================================
// Hospital API
// ============================================================
export const hospitalAPI = {
  getInfo:        async () => api.get('/hospital/info'),
  getStats:       async () => api.get('/hospital/stats'),
  getDepartments: async () => api.get('/hospital/departments'),
  getDoctors:     async () => api.get('/hospital/doctors'),
};

// ============================================================
// Token helpers
// ============================================================
export const tokenHelper = {
  save: (token, refreshToken, user) => {
    localStorage.setItem('mednex_token',         token);
    localStorage.setItem('mednex_refresh_token', refreshToken);
    localStorage.setItem('mednex_user',          JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('mednex_token');
    localStorage.removeItem('mednex_refresh_token');
    localStorage.removeItem('mednex_user');
    localStorage.removeItem('mednex_tenant');
  },
  getToken:   () => localStorage.getItem('mednex_token'),
  getUser:    () => {
    try {
      const s = localStorage.getItem('mednex_user');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  },
  isLoggedIn: () => !!localStorage.getItem('mednex_token'),
};

// ============================================================
// PDF download helper
// ============================================================
export const downloadPDF = (blobResponse, filename) => {
  const url  = window.URL.createObjectURL(new Blob([blobResponse.data]));
  const link = document.createElement('a');
  link.href  = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default api;
