import axios from 'axios';

const BASE_URL = 'http://localhost:8082/api';

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT + Tenant headers automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('mednex_token');
  const tenant = localStorage.getItem('mednex_tenant') || 'tenant_a';
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  config.headers['X-Tenant-ID'] = tenant;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout:   ()     => api.post('/auth/logout'),
  me:       ()     => api.get('/auth/me'),
};

// ── Patients ──────────────────────────────────────────
export const patientAPI = {
  getAll:    ()       => api.get('/patients'),
  getById:   (id)     => api.get(`/patients/${id}`),
  search:    (term)   => api.get(`/patients/search?term=${term}`),
  create:    (data)   => api.post('/patients', data),
  update:    (id, d)  => api.put(`/patients/${id}`, d),
  delete:    (id)     => api.delete(`/patients/${id}`),
  getRecent: ()       => api.get('/patients/recent'),
};

// ── Appointments ──────────────────────────────────────
export const appointmentAPI = {
  getAll:       ()       => api.get('/appointments'),
  getById:      (id)     => api.get(`/appointments/${id}`),
  getByDate:    (date)   => api.get(`/appointments/date/${date}`),
  getByPatient: (pid)    => api.get(`/appointments/patient/${pid}`),
  getByDoctor:  (did)    => api.get(`/appointments/doctor/${did}`),
  create:       (data)   => api.post('/appointments', data),
  update:       (id, d)  => api.put(`/appointments/${id}`, d),
  cancel:       (id)     => api.patch(`/appointments/${id}/cancel`),
};

// ── Medical Records ───────────────────────────────────
export const medicalRecordAPI = {
  getByPatient: (pid)    => api.get(`/medical-records/patient/${pid}`),
  getById:      (id)     => api.get(`/medical-records/${id}`),
  create:       (data)   => api.post('/medical-records', data),
  update:       (id, d)  => api.put(`/medical-records/${id}`, d),
};

// ── Dashboard ─────────────────────────────────────────
export const dashboardAPI = {
  getStats:           () => api.get('/dashboard/stats'),
  getRecentPatients:  () => api.get('/dashboard/recent-patients'),
  getRecentAppts:     () => api.get('/dashboard/recent-appointments'),
  getBedOccupancy:    () => api.get('/dashboard/bed-occupancy'),
};

// ── Analytics ─────────────────────────────────────────
export const analyticsAPI = {
  getBedOccupancy: () => api.get('/analytics/bed-occupancy'),
  getTrend:        () => api.get('/analytics/bed-occupancy/trend'),
  getSummary:      () => api.get('/analytics/summary'),
};

// ── Export ────────────────────────────────────────────
export const exportAPI = {
  exportPatientPDF: (id) =>
    api.get(`/export/patient/${id}/pdf`, { responseType: 'blob' }),
};

// ── Audit ─────────────────────────────────────────────
export const auditAPI = {
  getLogs: () => api.get('/audit-logs'),
};

export default api;
