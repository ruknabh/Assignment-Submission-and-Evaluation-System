import { Router } from 'express';
import {
  createAssignmentHandler,
  getAssignmentsByCourseHandler,
  getAllAssignmentsHandler,
  getAssignmentByIdHandler,
  updateAssignmentHandler,
  deleteAssignmentHandler,
} from '../controllers/assignment.controller.js';
import authenticate from '../middleware/authenticate.js';
import requireRole from '../middleware/requireRole.js';

const router = Router();

// All assignment routes require authentication
router.use(authenticate);

// GET  /api/assignments       — role-filtered list across all courses
router.get('/', getAllAssignmentsHandler);

// GET  /api/assignments/:id   — single assignment, role-checked
router.get('/:id', getAssignmentByIdHandler);

// PATCH /api/assignments/:id  — teacher (own course) and admin
router.patch('/:id', requireRole('teacher', 'admin'), updateAssignmentHandler);

// DELETE /api/assignments/:id — teacher (own course) and admin
router.delete('/:id', requireRole('teacher', 'admin'), deleteAssignmentHandler);

export default router;