import { z } from 'zod';

// Register schema
// Admin cannot self-register — only student or teacher allowed
export const registerSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be under 100 characters')
    .trim(),

  email: z
    .string()
    .email('Invalid email address')
    .max(255)
    .trim()
    .toLowerCase(),

  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be under 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores')
    .trim(),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be under 100 characters'),

  role: z.enum(['student', 'teacher'], {
    errorMap: () => ({ message: 'Role must be either student or teacher' }),
  }),
});

// Login schema
export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .trim()
    .toLowerCase(),

  password: z
    .string()
    .min(1, 'Password is required'),
});