import {
  createEnrollment,
  findEnrollment,
  findEnrollmentById,
  getEnrollmentsByCourse,
  getEnrollmentsByCourseAndStatus,
  getEnrollmentsByStudent,
  getAllEnrollments,
  updateEnrollmentStatus,
  resetEnrollmentToPending,
  reEnrollDirect,
  deleteEnrollment,
  findStudentById,
} from '../queries/enrollment.queries.js';
import { getCourseById } from '../queries/course.queries.js';
import {
  requestEnrollmentSchema,
  directEnrollSchema,
  updateEnrollmentSchema,
} from '../validators/enrollment.validator.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /api/enrollments/request
// Student requests to join a course — creates a pending enrollment
export const requestEnrollment = asyncHandler(async (req, res) => {
  const parsed = requestEnrollmentSchema.parse(req.body);
  const { course_id } = parsed;
  const student_id = req.user.id; // always from token

  // Verify course exists
  const course = await getCourseById(course_id);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  // Check if any enrollment record already exists for this pair
  const existing = await findEnrollment(student_id, course_id);

  if (existing) {
    if (existing.status === 'active') {
      throw new ApiError(409, 'You are already enrolled in this course');
    }
    if (existing.status === 'pending') {
      throw new ApiError(409, 'You already have a pending request for this course');
    }
    // Rejected or withdrawn — allow re-request, resets to pending
    const enrollment = await resetEnrollmentToPending(student_id, course_id);
    return res.status(200).json({
      success: true,
      message: 'Enrollment request re-submitted successfully',
      enrollment,
    });
  }

  // Fresh request
  const enrollment = await createEnrollment(student_id, course_id, 'pending');

  res.status(201).json({
    success: true,
    message: 'Enrollment request sent successfully',
    enrollment,
  });
});

// POST /api/enrollments
// Admin directly enrolls a student — skips pending, goes straight to active
export const directEnroll = asyncHandler(async (req, res) => {
  const parsed = directEnrollSchema.parse(req.body);
  const { student_id, course_id } = parsed;

  // Verify student exists and is actually a student
  const student = await findStudentById(student_id);
  if (!student) {
    throw new ApiError(404, 'Student not found or user is not a student');
  }

  // Verify course exists
  const course = await getCourseById(course_id);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const existing = await findEnrollment(student_id, course_id);

  if (existing) {
    if (existing.status === 'active') {
      throw new ApiError(409, 'Student is already enrolled in this course');
    }
    // Any other status — admin directly re-activates
    const enrollment = await reEnrollDirect(student_id, course_id);
    return res.status(200).json({
      success: true,
      message: 'Student re-enrolled successfully',
      enrollment,
    });
  }

  const enrollment = await createEnrollment(student_id, course_id, 'active');

  res.status(201).json({
    success: true,
    message: 'Student enrolled successfully',
    enrollment,
  });
});

// PATCH /api/enrollments/:id/approve
// Teacher approves a pending request for their own course
// Admin can approve any
export const approveEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await findEnrollmentById(req.params.id);

  if (!enrollment) {
    throw new ApiError(404, 'Enrollment not found');
  }

  // Only pending enrollments can be approved
  if (enrollment.status !== 'pending') {
    throw new ApiError(400, `Cannot approve an enrollment with status: ${enrollment.status}`);
  }

  // Teacher can only approve for their own courses
  if (req.user.role === 'teacher' && enrollment.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You can only manage enrollments in your own courses');
  }

  const updated = await updateEnrollmentStatus(req.params.id, 'active');

  res.status(200).json({
    success: true,
    message: 'Enrollment approved successfully',
    enrollment: updated,
  });
});

// PATCH /api/enrollments/:id/reject
// Teacher rejects a pending request for their own course
// Admin can reject any
export const rejectEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await findEnrollmentById(req.params.id);

  if (!enrollment) {
    throw new ApiError(404, 'Enrollment not found');
  }

  if (enrollment.status !== 'pending') {
    throw new ApiError(400, `Cannot reject an enrollment with status: ${enrollment.status}`);
  }

  if (req.user.role === 'teacher' && enrollment.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You can only manage enrollments in your own courses');
  }

  const updated = await updateEnrollmentStatus(req.params.id, 'rejected');

  res.status(200).json({
    success: true,
    message: 'Enrollment request rejected',
    enrollment: updated,
  });
});

// PATCH /api/enrollments/:id
// General status update — admin and teacher
// Teacher can withdraw or complete students from their own course
export const updateEnrollmentHandler = asyncHandler(async (req, res) => {
  const enrollment = await findEnrollmentById(req.params.id);

  if (!enrollment) {
    throw new ApiError(404, 'Enrollment not found');
  }

  if (req.user.role === 'teacher' && enrollment.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You can only manage enrollments in your own courses');
  }

  const parsed = updateEnrollmentSchema.parse(req.body);
  const updated = await updateEnrollmentStatus(req.params.id, parsed.status);

  res.status(200).json({
    success: true,
    message: 'Enrollment status updated successfully',
    enrollment: updated,
  });
});

// GET /api/enrollments
// Admin → all | Teacher → must pass ?course_id= | Student → their own
export const getEnrollments = asyncHandler(async (req, res) => {
  let enrollments;

  if (req.user.role === 'admin') {
    enrollments = await getAllEnrollments();

  } else if (req.user.role === 'teacher') {
    const { course_id, status } = req.query;
    if (!course_id) {
      throw new ApiError(400, 'course_id query parameter is required');
    }

    const course = await getCourseById(course_id);
    if (!course) {
      throw new ApiError(404, 'Course not found');
    }
    if (course.instructor_id !== req.user.id) {
      throw new ApiError(403, 'You do not have access to this course');
    }

    // Teacher can filter by status — e.g. ?status=pending to see only requests
    enrollments = status
      ? await getEnrollmentsByCourseAndStatus(course_id, status)
      : await getEnrollmentsByCourse(course_id);

  } else {
    // Student sees all their own enrollments (all statuses)
    enrollments = await getEnrollmentsByStudent(req.user.id);
  }

  res.status(200).json({
    success: true,
    count: enrollments.length,
    enrollments,
  });
});

// GET /api/enrollments/:id
// Access-checked per role
export const getEnrollmentByIdHandler = asyncHandler(async (req, res) => {
  const enrollment = await findEnrollmentById(req.params.id);

  if (!enrollment) {
    throw new ApiError(404, 'Enrollment not found');
  }

  if (req.user.role === 'teacher' && enrollment.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You do not have access to this enrollment');
  }

  if (req.user.role === 'student' && enrollment.student_id !== req.user.id) {
    throw new ApiError(403, 'You do not have access to this enrollment');
  }

  res.status(200).json({
    success: true,
    enrollment,
  });
});

// DELETE /api/enrollments/:id — admin only
export const deleteEnrollmentHandler = asyncHandler(async (req, res) => {
  const enrollment = await findEnrollmentById(req.params.id);

  if (!enrollment) {
    throw new ApiError(404, 'Enrollment not found');
  }

  await deleteEnrollment(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Enrollment deleted successfully',
  });
});