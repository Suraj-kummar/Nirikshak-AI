import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nirikshak_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login    = (data) => api.post('/api/auth/login', data);
export const register = (data) => api.post('/api/auth/register', data);

// ── Exam ──────────────────────────────────────────────────────────────────────
export const getSession   = (id)         => api.get(`/api/exam/${id}`);
export const startExam    = (body)       => api.post('/api/exam/start', body);
export const endExam      = (id, body)   => api.post(`/api/exam/${id}/end`, body);
export const submitExam   = (id, body)   => api.post(`/api/exam/${id}/submit`, body);
export const getQuestions = (examId)     => api.get(`/api/exam/questions/${examId}`);

// ── Violations ────────────────────────────────────────────────────────────────
export const getViolationReport = (sessionId) => api.get(`/api/violations/${sessionId}`);
