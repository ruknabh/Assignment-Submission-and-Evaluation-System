import { z } from 'zod';

// Create course — teacher provides these fields
// instructor_id is NOT here — set automatically from req.user.id in controller
export const createCourseSchema = z.object({
  code: z
    .string()
    .min(2, 'Course code must be at least 2 characters')
    .max(20, 'Course code must be under 20 characters')
    .trim()
    .toUpperCase(),

  name: z
    .string()
    .min(3, 'Course name must be at least 3 characters')
    .max(150, 'Course name must be under 150 characters')
    .trim(),

  semester: z
    .string()
    .min(2, 'Semester is required')
    .max(20, 'Semester must be under 20 characters')
    .trim(),

  section: z
    .string()
    .max(10, 'Section must be under 10 characters')
    .trim()
    .optional(),
});

// Update course — all fields optional, at least one required
export const updateCourseSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(20)
    .trim()
    .toUpperCase()
    .optional(),

  name: z
    .string()
    .min(3)
    .max(150)
    .trim()
    .optional(),

  semester: z
    .string()
    .min(2)
    .max(20)
    .trim()
    .optional(),

  section: z
    .string()
    .max(10)
    .trim()
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided to update' }
);