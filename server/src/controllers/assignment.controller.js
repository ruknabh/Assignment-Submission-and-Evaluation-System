import {
  createAssignment,
  getAssignmentsByCourse,
  getAssignmentsForStudent,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  checkStudentAccessToAssignment,
} from '../queries/assignment.queries.js';
import { getCourseById } from '../queries/course.queries.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
} from '../validators/assignment.validator.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /api/courses/:courseId/assignments
// Teacher (own course) and admin only
export const createAssignmentHandler = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  // Verify course exists
  const course = await getCourseById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  // Teacher can only create assignments in their own course
  if (req.user.role === 'teacher' && course.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You can only create assignments in your own courses');
  }

  const parsed = createAssignmentSchema.parse(req.body);

  const assignment = await createAssignment({
    ...parsed,
    course_id:  courseId,
    created_by: req.user.id,
  });

  res.status(201).json({
    success: true,
    message: 'Assignment created successfully',
    assignment,
  });
});

// GET /api/courses/:courseId/assignments
// Teacher (own course) → assignments in that course
// Student → only if actively enrolled in that course
// Admin → any course
export const getAssignmentsByCourseHandler = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await getCourseById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  // Teacher can only view assignments in their own courses
  if (req.user.role === 'teacher' && course.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You do not have access to this course');
  }

  // Student must be actively enrolled
  if (req.user.role === 'student') {
    const { checkEnrollment } = await import('../queries/course.queries.js');
    const enrolled = await checkEnrollment(req.user.id, courseId);
    if (!enrolled) {
      throw new ApiError(403, 'You are not enrolled in this course');
    }
  }

  const assignments = await getAssignmentsByCourse(courseId);

  res.status(200).json({
    success: true,
    count: assignments.length,
    assignments,
  });
});

// GET /api/assignments
// Admin → all | Teacher → all their course assignments | Student → all enrolled course assignments
export const getAllAssignmentsHandler = asyncHandler(async (req, res) => {
  let assignments;

  if (req.user.role === 'admin') {
    assignments = await getAllAssignments();
  } else if (req.user.role === 'teacher') {
    // Get all assignments across all courses this teacher owns
    const { getCoursesByInstructor } = await import('../queries/course.queries.js');
    const courses = await getCoursesByInstructor(req.user.id);
    if (courses.length === 0) {
      return res.status(200).json({ success: true, count: 0, assignments: [] });
    }
    const courseIds = courses.map((c) => c.id);
    // Fetch assignments for all their courses in one query
    const result = await Promise.all(courseIds.map((id) => getAssignmentsByCourse(id)));
    assignments = result.flat();
  } else {
    // Student — only from actively enrolled courses
    assignments = await getAssignmentsForStudent(req.user.id);
  }

  res.status(200).json({
    success: true,
    count: assignments.length,
    assignments,
  });
});

// GET /api/assignments/:id
// Checks access per role before returning
export const getAssignmentByIdHandler = asyncHandler(async (req, res) => {
  const assignment = await getAssignmentById(req.params.id);
  if (!assignment) {
    throw new ApiError(404, 'Assignment not found');
  }

  // Teacher can only view assignments in their own courses
  if (req.user.role === 'teacher' && assignment.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You do not have access to this assignment');
  }

  // Student must be actively enrolled in the course this assignment belongs to
  if (req.user.role === 'student') {
    const access = await checkStudentAccessToAssignment(req.user.id, assignment.id);
    if (!access) {
      throw new ApiError(403, 'You are not enrolled in the course this assignment belongs to');
    }
  }

  res.status(200).json({
    success: true,
    assignment,
  });
});

// PATCH /api/assignments/:id
// Teacher (own course) and admin only
export const updateAssignmentHandler = asyncHandler(async (req, res) => {
  const assignment = await getAssignmentById(req.params.id);
  if (!assignment) {
    throw new ApiError(404, 'Assignment not found');
  }

  // Teacher can only update assignments in their own courses
  if (req.user.role === 'teacher' && assignment.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You can only update assignments in your own courses');
  }

  const parsed = updateAssignmentSchema.parse(req.body);

  // Prevent course_id and created_by from ever being changed
  delete parsed.course_id;
  delete parsed.created_by;

  const updated = await updateAssignment(req.params.id, parsed);

  res.status(200).json({
    success: true,
    message: 'Assignment updated successfully',
    assignment: updated,
  });
});

// DELETE /api/assignments/:id
// Teacher (own course) and admin only — cascade removes all submissions
export const deleteAssignmentHandler = asyncHandler(async (req, res) => {
  const assignment = await getAssignmentById(req.params.id);
  if (!assignment) {
    throw new ApiError(404, 'Assignment not found');
  }

  // Teacher can only delete assignments in their own courses
  if (req.user.role === 'teacher' && assignment.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You can only delete assignments in your own courses');
  }

  await deleteAssignment(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Assignment deleted successfully',
  });
});