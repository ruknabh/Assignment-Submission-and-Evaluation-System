import api from './axios.js';

// Get all submissions (role-filtered)
export const getSubmissionsApi = async () => {
  const res = await api.get('/submissions');
  return res.data;
};

// Get submissions for a specific assignment — teacher
export const getSubmissionsByAssignmentApi = async (assignmentId) => {
  const res = await api.get(`/assignments/${assignmentId}/submissions`);
  return res.data;
};

// Get single submission by ID
export const getSubmissionByIdApi = async (submissionId) => {
  const res = await api.get(`/submissions/${submissionId}`);
  return res.data;
};

// Submit a file — uses FormData, NOT JSON
export const submitAssignmentApi = async (assignmentId, formData) => {
  const res = await api.post(`/assignments/${assignmentId}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// Download submission file
export const getSubmissionFileUrl = (submissionId) => {
  return `${import.meta.env.VITE_API_URL}/submissions/${submissionId}/file`;
};