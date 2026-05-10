import { z } from 'zod';

// Student requests to join a course — only needs course_id
// student_id comes from req.user.id, never from body
export const requestEnrollmentSchema = z.object({
  course_id: z
    .string()
    .uuid('Invalid course ID format'),
});

// Admin directly enrolls a student — needs both IDs
export const directEnrollSchema = z.object({
  student_id: z
    .string()
    .uuid('Invalid student ID format'),

  course_id: z
    .string()
    .uuid('Invalid course ID format'),
});

// Update enrollment status — used by teacher/admin
export const updateEnrollmentSchema = z.object({
  status: z.enum(['active', 'withdrawn', 'completed', 'rejected'], {
    errorMap: () => ({
      message: 'Status must be active, withdrawn, completed, or rejected',
    }),
  }),
});