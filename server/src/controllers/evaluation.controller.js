import {
  createEvaluation,
  findEvaluationBySubmission,
  getEvaluationById,
  getEvaluationsByAssignment,
  getEvaluationsByStudent,
  getAllEvaluations,
  updateEvaluation,
  deleteEvaluation,
  updateSubmissionStatus,
} from '../queries/evaluation.queries.js';
import { getSubmissionById }  from '../queries/submission.queries.js';
import { getAssignmentById }  from '../queries/assignment.queries.js';
import {
  createEvaluationSchema,
  updateEvaluationSchema,
} from '../validators/evaluation.validator.js';
import {
  calculateLetterGrade,
  calculatePercentage,
} from '../services/grade.service.js';
import ApiError     from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /api/submissions/:submissionId/evaluate
// Teacher (own course) and admin
export const createEvaluationHandler = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;

  // 1. Submission must exist
  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    throw new ApiError(404, 'Submission not found');
  }

  // 2. Teacher can only evaluate their own course submissions
  if (req.user.role === 'teacher' && submission.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You can only evaluate submissions from your own courses');
  }

  // 3. Cannot evaluate twice — must use PATCH to update
  const existing = await findEvaluationBySubmission(submissionId);
  if (existing) {
    throw new ApiError(
      409,
      'This submission already has an evaluation — use PATCH /api/evaluations/:id to update it'
    );
  }

  // 4. Validate input
  const parsed = createEvaluationSchema.parse(req.body);
  const { marks_obtained, comment, plagiarism_score } = parsed;

  // 5. marks_obtained cannot exceed assignment max_marks
  const assignment = await getAssignmentById(submission.assignment_id);
  if (marks_obtained > assignment.max_marks) {
    throw new ApiError(
      422,
      `marks_obtained (${marks_obtained}) cannot exceed max_marks (${assignment.max_marks})`
    );
  }

  // 6. Calculate grade server-side — never from client
  const letter_grade = calculateLetterGrade(marks_obtained, assignment.max_marks);
  const percentage   = calculatePercentage(marks_obtained, assignment.max_marks);

  // 7. Create evaluation
  const evaluation = await createEvaluation({
    submission_id: submissionId,
    graded_by:     req.user.id,
    marks_obtained,
    letter_grade,
    comment,
    plagiarism_score,
  });

  // 8. Auto-update submission status to evaluated
  await updateSubmissionStatus(submissionId, 'evaluated');

  res.status(201).json({
    success:    true,
    message:    'Evaluation created successfully',
    evaluation: { ...evaluation, percentage },
  });
});

// GET /api/evaluations
// Admin → all | Teacher → ?assignment_id= required | Student → own only
export const getEvaluationsHandler = asyncHandler(async (req, res) => {
  let evaluations;

  if (req.user.role === 'admin') {
    evaluations = await getAllEvaluations();

  } else if (req.user.role === 'teacher') {
    const { assignment_id } = req.query;
    if (!assignment_id) {
      throw new ApiError(400, 'assignment_id query parameter is required');
    }

    const assignment = await getAssignmentById(assignment_id);
    if (!assignment) {
      throw new ApiError(404, 'Assignment not found');
    }
    if (assignment.instructor_id !== req.user.id) {
      throw new ApiError(403, 'You do not have access to this assignment');
    }

    evaluations = await getEvaluationsByAssignment(assignment_id);

  } else {
    // Student — only evaluated/returned submissions visible
    evaluations = await getEvaluationsByStudent(req.user.id);
  }

  res.status(200).json({
    success: true,
    count:   evaluations.length,
    evaluations,
  });
});

// GET /api/evaluations/:id
export const getEvaluationByIdHandler = asyncHandler(async (req, res) => {
  const evaluation = await getEvaluationById(req.params.id);
  if (!evaluation) {
    throw new ApiError(404, 'Evaluation not found');
  }

  // Teacher can only view evaluations from their own courses
  if (req.user.role === 'teacher' && evaluation.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You do not have access to this evaluation');
  }

  // Student can only view their own evaluation
  if (req.user.role === 'student' && evaluation.student_id !== req.user.id) {
    throw new ApiError(403, 'You do not have access to this evaluation');
  }

  // Student cannot see evaluation if submission not yet evaluated or returned
  if (
    req.user.role === 'student' &&
    !['evaluated', 'returned'].includes(evaluation.submission_status)
  ) {
    throw new ApiError(403, 'Your submission has not been evaluated yet');
  }

  const percentage = calculatePercentage(evaluation.marks_obtained, evaluation.max_marks);

  res.status(200).json({
    success:    true,
    evaluation: { ...evaluation, percentage },
  });
});

// PATCH /api/evaluations/:id
// Teacher (own course) and admin — update marks, comment, plagiarism
export const updateEvaluationHandler = asyncHandler(async (req, res) => {
  const evaluation = await getEvaluationById(req.params.id);
  if (!evaluation) {
    throw new ApiError(404, 'Evaluation not found');
  }

  if (req.user.role === 'teacher' && evaluation.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You can only update evaluations from your own courses');
  }

  const parsed = updateEvaluationSchema.parse(req.body);

  // If marks are being updated, re-validate and recalculate grade
  if (parsed.marks_obtained !== undefined) {
    const assignment = await getAssignmentById(evaluation.assignment_id);
    if (parsed.marks_obtained > assignment.max_marks) {
      throw new ApiError(
        422,
        `marks_obtained (${parsed.marks_obtained}) cannot exceed max_marks (${assignment.max_marks})`
      );
    }
    // Recalculate — letter_grade always reflects current marks_obtained
    parsed.letter_grade = calculateLetterGrade(parsed.marks_obtained, assignment.max_marks);
  }

  const updated    = await updateEvaluation(req.params.id, parsed);
  const assignment = await getAssignmentById(evaluation.assignment_id);
  const percentage = calculatePercentage(updated.marks_obtained, assignment.max_marks);

  res.status(200).json({
    success:    true,
    message:    'Evaluation updated successfully',
    evaluation: { ...updated, percentage },
  });
});

// PATCH /api/evaluations/:id/return
// Teacher (own course) and admin — marks submission as returned to student
export const returnEvaluationHandler = asyncHandler(async (req, res) => {
  const evaluation = await getEvaluationById(req.params.id);
  if (!evaluation) {
    throw new ApiError(404, 'Evaluation not found');
  }

  if (req.user.role === 'teacher' && evaluation.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You can only return evaluations from your own courses');
  }

  // Must be evaluated before it can be returned
  if (evaluation.submission_status === 'returned') {
    throw new ApiError(400, 'This submission has already been returned to the student');
  }

  if (evaluation.submission_status !== 'evaluated') {
    throw new ApiError(400, 'Submission must be in evaluated status before it can be returned');
  }

  await updateSubmissionStatus(evaluation.submission_id, 'returned');

  res.status(200).json({
    success: true,
    message: 'Submission returned to student successfully',
  });
});

// DELETE /api/evaluations/:id
// Admin only — deletes evaluation and reverts submission to submitted
export const deleteEvaluationHandler = asyncHandler(async (req, res) => {
  const evaluation = await getEvaluationById(req.params.id);
  if (!evaluation) {
    throw new ApiError(404, 'Evaluation not found');
  }

  const deleted = await deleteEvaluation(req.params.id);

  // Revert submission so student can re-submit if needed
  await updateSubmissionStatus(deleted.submission_id, 'submitted');

  res.status(200).json({
    success: true,
    message: 'Evaluation deleted — submission reverted to submitted status',
  });
});