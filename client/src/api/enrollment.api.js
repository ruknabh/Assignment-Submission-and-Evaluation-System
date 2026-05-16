import api from './axios.js';

// Get enrollments for logged-in user (role-filtered by backend)
export const getEnrollmentsApi = async () => {
  const res = await api.get('/enrollments');
  return res.data;
};

// Get enrollments for a specific course — teacher passes course_id
export const getEnrollmentsByCourseApi = async (courseId) => {
  const res = await api.get(`/enrollments?course_id=${courseId}`);
  return res.data;
};

// Student requests to join a course
export const requestEnrollmentApi = async (courseId) => {
  const res = await api.post('/enrollments/request', { course_id: courseId });
  return res.data;
};

// Admin directly enrolls a student
export const directEnrollApi = async (studentId, courseId) => {
  const res = await api.post('/enrollments', { student_id: studentId, course_id: courseId });
  return res.data;
};

// Approve enrollment — teacher/admin
export const approveEnrollmentApi = async (enrollmentId) => {
  const res = await api.patch(`/enrollments/${enrollmentId}/approve`);
  return res.data;
};

// Reject enrollment — teacher/admin
export const rejectEnrollmentApi = async (enrollmentId) => {
  const res = await api.patch(`/enrollments/${enrollmentId}/reject`);
  return res.data;
};

// Update enrollment status
export const updateEnrollmentApi = async (enrollmentId, status) => {
  const res = await api.patch(`/enrollments/${enrollmentId}`, { status });
  return res.data;
};