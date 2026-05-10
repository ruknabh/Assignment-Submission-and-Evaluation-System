import { getAssignmentById }         from '../queries/assignment.queries.js';
import { checkEnrollment }           from '../queries/course.queries.js';
import {
  createSubmission,
  updateSubmissionFile,
  findSubmission,
  getSubmissionById,
  getSubmissionsByAssignment,
  getSubmissionsByStudent,
  getAllSubmissions,
  updateSubmissionStatus,
  deleteSubmission,
}                                    from '../queries/submission.queries.js';
import { updateSubmissionSchema }    from '../validators/submission.validator.js';
import { saveFile, deleteFile, resolveFilePath } from '../config/storage.js';
import ApiError                      from '../utils/ApiError.js';
import asyncHandler                  from '../utils/asyncHandler.js';

// POST /api/assignments/:assignmentId/submissions
// Student submits a file — or re-submits if one already exists
export const submitAssignment = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const student_id = req.user.id;

  // 1. Verify assignment exists
  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) {
    throw new ApiError(404, 'Assignment not found');
  }

  // 2. Verify student is actively enrolled in this assignment's course
  const enrolled = await checkEnrollment(student_id, assignment.course_id);
  if (!enrolled) {
    throw new ApiError(403, 'You are not enrolled in the course this assignment belongs to');
  }

  // 3. Verify a file was actually attached
  if (!req.file) {
    throw new ApiError(400, 'No file attached — please upload a file');
  }

  // 4. Validate file extension against assignment's allowed_file_types
  const ext = req.file.originalname.split('.').pop().toLowerCase();
  const allowedTypes = assignment.allowed_file_types; // JSONB array from DB

  if (!allowedTypes.includes(ext)) {
    throw new ApiError(
      422,
      `File type .${ext} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    );
  }

  // 5. Validate file size against assignment's max_file_size_mb
  const fileSizeMb = req.file.size / (1024 * 1024);
  if (fileSizeMb > assignment.max_file_size_mb) {
    throw new ApiError(
      422,
      `File size ${fileSizeMb.toFixed(2)}MB exceeds the limit of ${assignment.max_file_size_mb}MB`
    );
  }

  // 6. Check if submission already exists
  const existing = await findSubmission(assignmentId, student_id);

  if (existing) {
    // Cannot re-submit once evaluation has started
    if (existing.status === 'evaluated' || existing.status === 'returned') {
      throw new ApiError(403, 'Cannot re-submit — your submission has already been evaluated');
    }

    // Delete old file from disk before saving new one
    deleteFile(existing.file_path);

    // 7a. Calculate is_late server-side — client cannot influence this
    const is_late = new Date() > new Date(assignment.due_date);

    // 8a. Save new file to disk
    const { fileName, filePath, fileSizeKb } = await saveFile({
      buffer:       req.file.buffer,
      originalName: req.file.originalname,
      studentId:    student_id,
      assignmentId,
      courseId:     assignment.course_id,
    });

    // 9a. Update existing submission record
    const submission = await updateSubmissionFile({
      id: existing.id,
      file_name:    fileName,
      file_path:    filePath,
      file_size_kb: fileSizeKb,
      is_late,
    });

    return res.status(200).json({
      success: true,
      message: is_late
        ? 'Assignment re-submitted successfully (marked as late)'
        : 'Assignment re-submitted successfully',
      submission,
    });
  }

  // 7b. Fresh submission — calculate is_late
  const is_late = new Date() > new Date(assignment.due_date);

  // 8b. Save file to disk
  const { fileName, filePath, fileSizeKb } = await saveFile({
    buffer:       req.file.buffer,
    originalName: req.file.originalname,
    studentId:    student_id,
    assignmentId,
    courseId:     assignment.course_id,
  });

  // 9b. Insert submission record
  const submission = await createSubmission({
    assignment_id: assignmentId,
    student_id,
    file_name:    fileName,
    file_path:    filePath,
    file_size_kb: fileSizeKb,
    is_late,
  });

  res.status(201).json({
    success: true,
    message: is_late
      ? 'Assignment submitted successfully (marked as late)'
      : 'Assignment submitted successfully',
    submission,
  });
});

// GET /api/assignments/:assignmentId/submissions
// Teacher (own course) and admin — list all submissions for an assignment
export const getSubmissionsByAssignmentHandler = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;

  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) {
    throw new ApiError(404, 'Assignment not found');
  }

  // Teacher can only view submissions for their own courses
  if (req.user.role === 'teacher' && assignment.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You do not have access to this assignment');
  }

  const submissions = await getSubmissionsByAssignment(assignmentId);

  res.status(200).json({
    success: true,
    count: submissions.length,
    submissions,
  });
});

// GET /api/submissions
// Admin → all | Teacher → all from their courses | Student → their own
export const getAllSubmissionsHandler = asyncHandler(async (req, res) => {
  let submissions;

  if (req.user.role === 'admin') {
    submissions = await getAllSubmissions();
  } else if (req.user.role === 'teacher') {
    // Teacher gets submissions filtered by assignment_id query param
    // or all submissions across their courses
    const { assignment_id } = req.query;
    if (assignment_id) {
      const assignment = await getAssignmentById(assignment_id);
      if (!assignment) throw new ApiError(404, 'Assignment not found');
      if (assignment.instructor_id !== req.user.id) {
        throw new ApiError(403, 'You do not have access to this assignment');
      }
      submissions = await getSubmissionsByAssignment(assignment_id);
    } else {
      // All submissions from all their assignments — expensive but admin-like view for teacher
      submissions = await getAllSubmissions();
      // Filter to only their courses
      submissions = submissions.filter(
        (s) => s.instructor_id === req.user.id
      );
    }
  } else {
    // Student sees only their own submissions
    submissions = await getSubmissionsByStudent(req.user.id);
  }

  res.status(200).json({
    success: true,
    count: submissions.length,
    submissions,
  });
});

// GET /api/submissions/:id
// Role-checked access
export const getSubmissionByIdHandler = asyncHandler(async (req, res) => {
  const submission = await getSubmissionById(req.params.id);
  if (!submission) {
    throw new ApiError(404, 'Submission not found');
  }

  // Teacher can only view submissions from their courses
  if (req.user.role === 'teacher' && submission.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You do not have access to this submission');
  }

  // Student can only view their own submission
  if (req.user.role === 'student' && submission.student_id !== req.user.id) {
    throw new ApiError(403, 'You do not have access to this submission');
  }

  res.status(200).json({
    success: true,
    submission,
  });
});

// GET /api/submissions/:id/file
// Download the actual file — authenticated, role-checked
export const downloadSubmissionFile = asyncHandler(async (req, res) => {
  const submission = await getSubmissionById(req.params.id);
  if (!submission) {
    throw new ApiError(404, 'Submission not found');
  }

  // Teacher can only download files from their own courses
  if (req.user.role === 'teacher' && submission.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You do not have access to this file');
  }

  // Student can only download their own submission file
  if (req.user.role === 'student' && submission.student_id !== req.user.id) {
    throw new ApiError(403, 'You do not have access to this file');
  }

  const absPath = resolveFilePath(submission.file_path);

  // Verify file actually exists on disk
  const fs = await import('fs');
  if (!fs.default.existsSync(absPath)) {
    throw new ApiError(404, 'File not found on server');
  }

  // Send file with original display name
  res.download(absPath, submission.file_name);
});

// PATCH /api/submissions/:id
// Teacher (own course) and admin — manually update status
export const updateSubmissionHandler = asyncHandler(async (req, res) => {
  const submission = await getSubmissionById(req.params.id);
  if (!submission) {
    throw new ApiError(404, 'Submission not found');
  }

  if (req.user.role === 'teacher' && submission.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You can only manage submissions from your own courses');
  }

  const parsed = updateSubmissionSchema.parse(req.body);
  const updated = await updateSubmissionStatus(req.params.id, parsed.status);

  res.status(200).json({
    success: true,
    message: 'Submission status updated',
    submission: updated,
  });
});

// DELETE /api/submissions/:id
// Admin only — deletes record and file from disk
export const deleteSubmissionHandler = asyncHandler(async (req, res) => {
  const submission = await getSubmissionById(req.params.id);
  if (!submission) {
    throw new ApiError(404, 'Submission not found');
  }

  // Delete file from disk first
  deleteFile(submission.file_path);

  // Then delete DB record — cascade removes evaluation if exists
  await deleteSubmission(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Submission deleted successfully',
  });
});