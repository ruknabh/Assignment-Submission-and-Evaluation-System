import {
  createCourse,
  getAllCourses,
  getCoursesByInstructor,
  getCoursesByStudent,
  getCourseById,
  updateCourse,
  deleteCourse,
  checkEnrollment,
  searchCoursesByCode,
} from '../queries/course.queries.js';
import { createCourseSchema, updateCourseSchema } from '../validators/course.validator.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /api/courses
// Teacher and admin only — instructor_id always set from token, never from body
export const createCourseHandler = asyncHandler(async (req, res) => {
  const parsed = createCourseSchema.parse(req.body);

  const course = await createCourse({
    ...parsed,
    instructor_id: req.user.id,
  });

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    course,
  });
});

// GET /api/courses
// Returns different data based on role:
// admin → all courses, teacher → their courses, student → enrolled courses
export const getCoursesHandler = asyncHandler(async (req, res) => {
  let courses;

  if (req.user.role === 'admin') {
    courses = await getAllCourses();
  } else if (req.user.role === 'teacher') {
    courses = await getCoursesByInstructor(req.user.id);
  } else {
    // student
    courses = await getCoursesByStudent(req.user.id);
  }

  res.status(200).json({
    success: true,
    count: courses.length,
    courses,
  });
});

// GET /api/courses/:id
// Admin: any course | Teacher: only their own | Student: only if actively enrolled
export const getCourseByIdHandler = asyncHandler(async (req, res) => {
  const course = await getCourseById(req.params.id);

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  // Teacher can only view their own courses
  if (req.user.role === 'teacher' && course.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You do not have access to this course');
  }

  // Student can only view courses they are actively enrolled in
  if (req.user.role === 'student') {
    const enrolled = await checkEnrollment(req.user.id, course.id);
    if (!enrolled) {
      throw new ApiError(403, 'You are not enrolled in this course');
    }
  }

  res.status(200).json({
    success: true,
    course,
  });
});

// PATCH /api/courses/:id
// Teacher can update only their own course | Admin can update any
export const updateCourseHandler = asyncHandler(async (req, res) => {
  const course = await getCourseById(req.params.id);

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  // Teacher can only update their own course
  if (req.user.role === 'teacher' && course.instructor_id !== req.user.id) {
    throw new ApiError(403, 'You can only update your own courses');
  }

  const parsed = updateCourseSchema.parse(req.body);

  // Prevent instructor_id from being changed even if somehow passed
  delete parsed.instructor_id;

  const updated = await updateCourse(req.params.id, parsed);

  res.status(200).json({
    success: true,
    message: 'Course updated successfully',
    course: updated,
  });
});

// DELETE /api/courses/:id
// Admin only — cascade deletes all enrollments and assignments
export const deleteCourseHandler = asyncHandler(async (req, res) => {
  const course = await getCourseById(req.params.id);

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  await deleteCourse(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Course deleted successfully',
  });
});


// GET /api/courses/search?code=CS301
// All authenticated users — student uses to find course before requesting enrollment
export const searchCoursesHandler = asyncHandler(async (req, res) => {
  const { code } = req.query;
  if (!code || code.trim().length < 2) {
    throw new ApiError(400, 'Provide at least 2 characters for course code');
  }
  const courses = await searchCoursesByCode(code.trim());
  res.status(200).json({ success: true, count: courses.length, courses });
});