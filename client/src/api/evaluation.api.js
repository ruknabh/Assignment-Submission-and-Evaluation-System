import api from './axios.js';

// Get all evaluations (role-filtered)
export const getEvaluationsApi = async () => {
  const res = await api.get('/evaluations');
  return res.data;
};

// Get evaluations for a specific assignment — teacher
export const getEvaluationsByAssignmentApi = async (assignmentId) => {
  const res = await api.get(`/evaluations?assignment_id=${assignmentId}`);
  return res.data;
};

// Get single evaluation by ID
export const getEvaluationByIdApi = async (evaluationId) => {
  const res = await api.get(`/evaluations/${evaluationId}`);
  return res.data;
};

// Create evaluation — teacher grades a submission
export const createEvaluationApi = async (submissionId, data) => {
  const res = await api.post(`/submissions/${submissionId}/evaluate`, data);
  return res.data;
};

// Update evaluation
export const updateEvaluationApi = async (evaluationId, data) => {
  const res = await api.patch(`/evaluations/${evaluationId}`, data);
  return res.data;
};

// Return evaluated submission to student
export const returnEvaluationApi = async (evaluationId) => {
  const res = await api.patch(`/evaluations/${evaluationId}/return`);
  return res.data;
};