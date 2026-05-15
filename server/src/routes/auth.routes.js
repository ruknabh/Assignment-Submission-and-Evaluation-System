import { Router } from 'express';
import {
  register,
  login,
  getMe,
  getAllUsersHandler,
  getAllStudentsHandler,
} from '../controllers/auth.controller.js';
import authenticate from '../middleware/authenticate.js';
import requireRole from '../middleware/requireRole.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route — requires valid JWT
router.get('/me', authenticate, getMe);

// Admin only — list all users and students
router.get('/users',    authenticate, requireRole('admin'), getAllUsersHandler);
router.get('/students', authenticate, requireRole('admin'), getAllStudentsHandler);

export default router;