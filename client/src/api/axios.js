import axios from 'axios';

// Single axios instance used by every API file
// Base URL comes from .env — never hardcoded
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attaches token to every request automatically
// No page or component ever manually adds Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ases_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handles global 401 (token expired or invalid)
// Clears storage and redirects to login without any component knowing
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ases_token');
      localStorage.removeItem('ases_user');
      // Hard redirect — clears all React state cleanly
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;