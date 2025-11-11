import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  requestMagicLink: (email) => api.post('/auth/request-magic-link', { email }),
  verifyMagicLink: (token) => api.post('/auth/verify-magic-link', { token }),
  getMe: () => api.get('/auth/me'),
};

// Teams API
export const teamsAPI = {
  getAll: () => api.get('/teams'),
  getOne: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),

  addParticipant: (id, data) => api.post(`/teams/${id}/participants`, data),
  removeParticipant: (id, participantId) => api.delete(`/teams/${id}/participants/${participantId}`),

  addConstraint: (id, data) => api.post(`/teams/${id}/constraints`, data),
  removeConstraint: (id, constraintId) => api.delete(`/teams/${id}/constraints/${constraintId}`),

  optimize: (id) => api.post(`/teams/${id}/optimize`),
  updateTeams: (id, teams) => api.put(`/teams/${id}/teams`, { generatedTeams: teams }),

  // History & Versioning
  saveVersion: (id, notes) => api.post(`/teams/${id}/history/save`, { notes }),
  getHistory: (id) => api.get(`/teams/${id}/history`),
  restoreVersion: (id, version) => api.post(`/teams/${id}/history/${version}/restore`),
  deleteVersion: (id, version) => api.delete(`/teams/${id}/history/${version}`),

  // Notifications
  sendNotifications: (id) => api.post(`/teams/${id}/notify`),
  updateNotificationSettings: (id, settings) => api.patch(`/teams/${id}/notifications`, settings),
};

// Export & Import API
export const exportAPI = {
  exportTeamsCSV: (id) => api.get(`/export/teams/${id}/csv`, { responseType: 'blob' }),
  exportParticipantsCSV: (id) => api.get(`/export/teams/${id}/participants/csv`, { responseType: 'blob' }),
  exportTeamsPDF: (id) => api.get(`/export/teams/${id}/pdf`, { responseType: 'blob' }),
  getStats: (id) => api.get(`/export/teams/${id}/stats`),
  importParticipants: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/export/teams/${id}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getSampleCSV: () => api.get('/export/sample-csv', { responseType: 'blob' }),
};

// Admin API
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getProjects: () => api.get('/admin/projects'),
  getStats: () => api.get('/admin/stats'),
};

export default api;
