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
import {
  submitAssignment,
  getSubmissionsByAssignmentHandler,
  checkPlagiarismHandler,
} from '../controllers/submission.controller.js';
import upload from '../config/multer.js';



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



// Nested routes

// POST /api/assignments/:assignmentId/submit  — student submits file
router.post(
  '/:assignmentId/submit',
  requireRole('student'),
  upload.single('file'),   // 'file' is the form-data field name
  submitAssignment
);

// GET /api/assignments/:assignmentId/submissions — teacher/admin lists all submissions
router.get(
  '/:assignmentId/submissions',
  requireRole('teacher', 'admin'),
  getSubmissionsByAssignmentHandler
);

// Teacher/admin runs plagiarism check for an assignment
router.post(
  '/:assignmentId/plagiarism-check',
  requireRole('teacher', 'admin'),
  checkPlagiarismHandler
);


export default router;