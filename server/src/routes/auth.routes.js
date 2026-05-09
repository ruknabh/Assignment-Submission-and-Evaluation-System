import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route — requires valid JWT
router.get('/me', authenticate, getMe);

export default router;