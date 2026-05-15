import api from './axios.js';

// Register new user — student or teacher only
export const registerApi = async (data) => {
  const res = await api.post('/auth/register', data);
  return res.data;
};

// Login with email and password
export const loginApi = async (data) => {
  const res = await api.post('/auth/login', data);
  return res.data;
};

// Get currently logged in user — uses token from axios interceptor
export const getMeApi = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

// Get all students — admin only, used in enrollment manager
export const getAllStudentsApi = async () => {
  const res = await api.get('/auth/students');
  return res.data;
};

// Get all users — admin only
export const getAllUsersApi = async () => {
  const res = await api.get('/auth/users');
  return res.data;
};