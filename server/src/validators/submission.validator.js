import { z } from 'zod';

// Submission update — only status can be changed via this validator
// Used by teacher/admin to manually change submission status
export const updateSubmissionSchema = z.object({
  status: z.enum(['submitted', 'evaluated', 'returned'], {
    errorMap: () => ({
      message: 'Status must be submitted, evaluated, or returned',
    }),
  }),
});

// No create schema needed — submission data comes from:
// req.file    → multer (the actual file)
// req.params  → assignmentId from URL
// req.user    → studentId from JWT token
// All validated manually in controller against assignment settings