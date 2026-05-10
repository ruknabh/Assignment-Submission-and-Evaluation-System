import { Router } from 'express';
import {
  createCourseHandler,
  getCoursesHandler,
  getCourseByIdHandler,
  updateCourseHandler,
  deleteCourseHandler,
} from '../controllers/course.controller.js';
import authenticate from '../middleware/authenticate.js';
import requireRole from '../middleware/requireRole.js';

const router = Router();

// All course routes require authentication
router.use(authenticate);

// GET /api/courses — all roles, returns role-filtered results
router.get('/', getCoursesHandler);

// GET /api/courses/:id — all roles, access-checked per role in controller
router.get('/:id', getCourseByIdHandler);

// POST /api/courses — teacher and admin only
router.post('/', requireRole('teacher', 'admin'), createCourseHandler);

// PATCH /api/courses/:id — teacher (own) and admin
router.patch('/:id', requireRole('teacher', 'admin'), updateCourseHandler);

// DELETE /api/courses/:id — admin only
router.delete('/:id', requireRole('admin'), deleteCourseHandler);

export default router;