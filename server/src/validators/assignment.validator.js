import { z } from 'zod';

// Allowed file type entries — lowercase strings like "pdf", "zip", "py"
const fileTypeSchema = z
  .string()
  .min(1)
  .max(10)
  .regex(/^[a-z0-9]+$/, 'File type must be lowercase alphanumeric e.g. pdf, zip, py');

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

  due_date: z
    .string()
    .datetime({ message: 'due_date must be a valid ISO 8601 datetime e.g. 2025-12-01T23:59:00Z' })
    .refine(
      (val) => new Date(val) > new Date(),
      { message: 'due_date must be in the future' }
    ),

  allowed_file_types: z
    .array(fileTypeSchema)
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

    due_date: z
      .string()
      .datetime({ message: 'due_date must be a valid ISO 8601 datetime' })
      .refine(
        (val) => new Date(val) > new Date(),
        { message: 'due_date must be in the future' }
      )
      .optional(),

    allowed_file_types: z
      .array(fileTypeSchema)
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