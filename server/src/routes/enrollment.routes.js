import { Router } from 'express';
import {
  requestEnrollment,
  directEnroll,
  approveEnrollment,
  rejectEnrollment,
  updateEnrollmentHandler,
  getEnrollments,
  getEnrollmentByIdHandler,
  deleteEnrollmentHandler,
} from '../controllers/enrollment.controller.js';
import authenticate from '../middleware/authenticate.js';
import requireRole from '../middleware/requireRole.js';

const router = Router();

// All enrollment routes require authentication
router.use(authenticate);

// GET  /api/enrollments        — role-filtered list
router.get('/', getEnrollments);

// GET  /api/enrollments/:id    — single enrollment, role-checked
router.get('/:id', getEnrollmentByIdHandler);

// POST /api/enrollments/request — student requests to join a course
router.post('/request', requireRole('student'), requestEnrollment);

// POST /api/enrollments        — admin directly enrolls a student
router.post('/', requireRole('admin'), directEnroll);

// PATCH /api/enrollments/:id/approve — teacher/admin approves pending request
router.patch('/:id/approve', requireRole('teacher', 'admin'), approveEnrollment);

// PATCH /api/enrollments/:id/reject  — teacher/admin rejects pending request
router.patch('/:id/reject', requireRole('teacher', 'admin'), rejectEnrollment);

// PATCH /api/enrollments/:id  — general status update (withdraw, complete)
router.patch('/:id', requireRole('teacher', 'admin'), updateEnrollmentHandler);

// DELETE /api/enrollments/:id — admin only hard delete
router.delete('/:id', requireRole('admin'), deleteEnrollmentHandler);

export default router;