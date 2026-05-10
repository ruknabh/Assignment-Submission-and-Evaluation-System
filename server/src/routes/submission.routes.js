import { Router } from 'express';
import {
  submitAssignment,
  getSubmissionsByAssignmentHandler,
  getAllSubmissionsHandler,
  getSubmissionByIdHandler,
  downloadSubmissionFile,
  updateSubmissionHandler,
  deleteSubmissionHandler,
} from '../controllers/submission.controller.js';
import authenticate  from '../middleware/authenticate.js';
import requireRole   from '../middleware/requireRole.js';
import upload        from '../config/multer.js';
import { createEvaluationHandler } from '../controllers/evaluation.controller.js';

const router = Router();

router.use(authenticate);

// GET  /api/submissions          — role-filtered list
router.get('/', getAllSubmissionsHandler);

// GET  /api/submissions/:id      — single submission, role-checked
router.get('/:id', getSubmissionByIdHandler);

// GET  /api/submissions/:id/file — download file, role-checked
router.get('/:id/file', downloadSubmissionFile);


// Nested route
// POST /api/submissions/:submissionId/evaluate — teacher/admin grades a submission
router.post(
  '/:submissionId/evaluate',
  requireRole('teacher', 'admin'),
  createEvaluationHandler
);


// PATCH /api/submissions/:id     — update status, teacher/admin
router.patch('/:id', requireRole('teacher', 'admin'), updateSubmissionHandler);

// DELETE /api/submissions/:id    — admin only
router.delete('/:id', requireRole('admin'), deleteSubmissionHandler);







export default router;