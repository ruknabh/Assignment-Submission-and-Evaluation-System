import api from './axios.js';

// Get all assignments (role-filtered by backend)
export const getAssignmentsApi = async () => {
  const res = await api.get('/assignments');
  return res.data;
};

// Get assignments for a specific course
export const getAssignmentsByCourseApi = async (courseId) => {
  const res = await api.get(`/courses/${courseId}/assignments`);
  return res.data;
};

// Get single assignment by ID
export const getAssignmentByIdApi = async (assignmentId) => {
  const res = await api.get(`/assignments/${assignmentId}`);
  return res.data;
};

// Create assignment — teacher only, nested under course
export const createAssignmentApi = async (courseId, data) => {
  const res = await api.post(`/courses/${courseId}/assignments`, data);
  return res.data;
};

// Update assignment
export const updateAssignmentApi = async (assignmentId, data) => {
  const res = await api.patch(`/assignments/${assignmentId}`, data);
  return res.data;
};

// Delete assignment
export const deleteAssignmentApi = async (assignmentId) => {
  const res = await api.delete(`/assignments/${assignmentId}`);
  return res.data;
};