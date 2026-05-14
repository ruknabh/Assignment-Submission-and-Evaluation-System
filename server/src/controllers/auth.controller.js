import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { findUserByEmail, findUserByUsername, createUser } from '../queries/auth.queries.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Helper: generate JWT token
// Payload contains only non-sensitive fields needed by frontend and middleware
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper: build the safe user object returned in responses
// password_hash is never included
const safeUser = (user) => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  username: user.username,
  role: user.role,
  created_at: user.created_at,
});

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {

  // 1. Validate input with zod — throws ZodError if invalid → caught by errorHandler
  const parsed = registerSchema.parse(req.body);
  const { full_name, email, username, password, role } = parsed;

  // 2. Check if email already exists
  const existingEmail = await findUserByEmail(email);
  if (existingEmail) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  // 3. Check if username already exists

  const existingUsername = await findUserByUsername(username);
  if (existingUsername) {
    throw new ApiError(409, 'This username is already taken');
  }

  // 4. Hash password — salt rounds 10 is the standard balance of security vs speed
  const password_hash = await bcrypt.hash(password, 10);

  // 5. Create user in DB
  const user = await createUser({ full_name, email, username, password_hash, role });

  // 6. Generate token
  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user: safeUser(user),
  });
});

// POST /api/auth/login

export const login = asyncHandler(async (req, res) => {

  // 1. Validate input
  const parsed = loginSchema.parse(req.body);
  const { email, password } = parsed;

  // 2. Find user by email
  const user = await findUserByEmail(email);
  if (!user) {
    // Intentionally vague message — don't reveal whether email exists
    throw new ApiError(401, 'Invalid email or password');
  }

  // 3. Compare password with stored hash
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // 4. Generate token
  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    token,
    user: safeUser(user),
  });
});

// GET /api/auth/me

// Protected route — returns the currently logged in user's data
export const getMe = asyncHandler(async (req, res) => {
  // req.user is set by authenticate middleware
  // We re-fetch from DB to get fresh data (role may have changed)
  const user = await findUserByEmail(req.user.email);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    success: true,
    user: safeUser(user),
  });
});


// GET /api/auth/users — admin only
export const getAllUsersHandler = asyncHandler(async (req, res) => {
  const users = await getAllUsers();
  res.status(200).json({ success: true, count: users.length, users });
});

// GET /api/auth/students — admin only, for enrollment dropdown
export const getAllStudentsHandler = asyncHandler(async (req, res) => {
  const students = await getAllStudents();
  res.status(200).json({ success: true, count: students.length, students });
});