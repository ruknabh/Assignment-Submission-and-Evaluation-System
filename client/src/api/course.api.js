import api from './axios.js';

// Get all courses for logged-in user (role-filtered by backend)
export const getCoursesApi = async () => {
  const res = await api.get('/courses');
  return res.data;
};

// Get single course by ID
export const getCourseByIdApi = async (courseId) => {
  const res = await api.get(`/courses/${courseId}`);
  return res.data;
};

// Search courses by code — student uses this before requesting enrollment
export const searchCourseByCodeApi = async (code) => {
  const res = await api.get(`/courses/search?code=${encodeURIComponent(code)}`);
  return res.data;
};

// Create course — teacher only
export const createCourseApi = async (data) => {
  const res = await api.post('/courses', data);
  return res.data;
};

// Update course
export const updateCourseApi = async (courseId, data) => {
  const res = await api.patch(`/courses/${courseId}`, data);
  return res.data;
};

// Delete course — admin only
export const deleteCourseApi = async (courseId) => {
  const res = await api.delete(`/courses/${courseId}`);
  return res.data;
};