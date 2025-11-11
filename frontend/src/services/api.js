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
};

export default api;
