import { Router } from 'express';
import {
  submitAssignment,
  getSubmissionsByAssignmentHandler,
  getAllSubmissionsHandler,
  getSubmissionByIdHandler,
  downloadSubmissionFile,
  updateSubmissionHandler,
  deleteSubmissionHandler,
  checkPlagiarismHandler,
} from '../controllers/submission.controller.js';
import authenticate  from '../middleware/authenticate.js';
import requireRole   from '../middleware/requireRole.js';
import upload        from '../config/multer.js';
import { createEvaluationHandler } from '../controllers/evaluation.controller.js';

const router = Router();

router.use(authenticate);

// GET /api/submissions
router.get('/', getAllSubmissionsHandler);

// Specific routes BEFORE /:id to avoid param conflicts
// GET /api/submissions/:id/file
router.get('/:id/file', downloadSubmissionFile);

// POST /api/submissions/:submissionId/evaluate
router.post(
  '/:submissionId/evaluate',
  requireRole('teacher', 'admin'),
  createEvaluationHandler
);

// GET /api/submissions/:id
router.get('/:id', getSubmissionByIdHandler);

// PATCH /api/submissions/:id
router.patch('/:id', requireRole('teacher', 'admin'), updateSubmissionHandler);

// DELETE /api/submissions/:id
router.delete('/:id', requireRole('admin'), deleteSubmissionHandler);

export default router;