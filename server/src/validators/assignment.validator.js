import { z } from 'zod';

// Validates a date string from either:
// - datetime-local input: "2025-12-01T23:59" (no seconds, no Z)
// - ISO string: "2025-12-01T23:59:00Z"
// Converts both to a real Date and checks it's valid and in the future
const futureDateString = (isEdit) =>
  z
    .string()
    .min(1, 'Due date is required')
    .refine(
      (val) => !isNaN(new Date(val).getTime()),
      { message: 'Due date must be a valid date' }
    )
    .refine(
      (val) => isEdit || new Date(val) > new Date(),
      { message: 'Due date must be in the future' }
    );

export const createAssignmentSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be under 200 characters')
    .trim(),

  description: z
    .string()
    .max(5000, 'Description must be under 5000 characters')
    .trim()
    .optional(),

  max_marks: z
    .number({ invalid_type_error: 'max_marks must be a number' })
    .int('max_marks must be a whole number')
    .positive('max_marks must be greater than 0'),

  due_date: futureDateString(false),

  allowed_file_types: z
    .array(
      z
        .string()
        .min(1)
        .max(10)
        .regex(/^[a-z0-9]+$/, 'File type must be lowercase alphanumeric')
    )
    .min(1, 'At least one file type must be allowed')
    .max(10, 'Cannot allow more than 10 file types')
    .default(['pdf']),

  max_file_size_mb: z
    .number({ invalid_type_error: 'max_file_size_mb must be a number' })
    .int('max_file_size_mb must be a whole number')
    .positive('max_file_size_mb must be greater than 0')
    .max(100, 'max_file_size_mb cannot exceed 100')
    .default(10),
});

// Update — all fields optional, at least one required
export const updateAssignmentSchema = z
  .object({
    title: z
      .string()
      .min(3)
      .max(200)
      .trim()
      .optional(),

    description: z
      .string()
      .max(5000)
      .trim()
      .optional(),

    max_marks: z
      .number()
      .int()
      .positive()
      .optional(),

    // On edit, due_date can be any valid date (past or future — teacher's choice)
    due_date: futureDateString(true).optional(),

    allowed_file_types: z
      .array(
        z
          .string()
          .min(1)
          .max(10)
          .regex(/^[a-z0-9]+$/)
      )
      .min(1)
      .max(10)
      .optional(),

    max_file_size_mb: z
      .number()
      .int()
      .positive()
      .max(100)
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided to update' }
  );