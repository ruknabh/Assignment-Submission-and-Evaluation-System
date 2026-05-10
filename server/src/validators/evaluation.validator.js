import { z } from 'zod';

// letter_grade is NOT accepted from client — always calculated server-side
export const createEvaluationSchema = z.object({
  marks_obtained: z
    .number({ invalid_type_error: 'marks_obtained must be a number' })
    .int('marks_obtained must be a whole number')
    .min(0, 'marks_obtained cannot be negative'),

  comment: z
    .string()
    .max(2000, 'Comment must be under 2000 characters')
    .trim()
    .optional(),

  plagiarism_score: z
    .number({ invalid_type_error: 'plagiarism_score must be a number' })
    .int('plagiarism_score must be a whole number')
    .min(0, 'plagiarism_score cannot be negative')
    .max(100, 'plagiarism_score cannot exceed 100')
    .default(0),
});

// All fields optional on update — but at least one required
export const updateEvaluationSchema = z
  .object({
    marks_obtained: z
      .number()
      .int()
      .min(0)
      .optional(),

    comment: z
      .string()
      .max(2000)
      .trim()
      .optional(),

    plagiarism_score: z
      .number()
      .int()
      .min(0)
      .max(100)
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided to update' }
  );