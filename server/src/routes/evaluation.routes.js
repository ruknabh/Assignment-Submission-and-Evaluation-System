import { Router } from 'express';
import {
  getEvaluationsHandler,
  getEvaluationByIdHandler,
  updateEvaluationHandler,
  returnEvaluationHandler,
  deleteEvaluationHandler,
} from '../controllers/evaluation.controller.js';
import authenticate from '../middleware/authenticate.js';
import requireRole  from '../middleware/requireRole.js';

const router = Router();

router.use(authenticate);

// GET  /api/evaluations
router.get('/', getEvaluationsHandler);

// PATCH /api/evaluations/:id/return — specific route MUST come before /:id
router.patch('/:id/return', requireRole('teacher', 'admin'), returnEvaluationHandler);

// GET  /api/evaluations/:id
router.get('/:id', getEvaluationByIdHandler);

// PATCH /api/evaluations/:id
router.patch('/:id', requireRole('teacher', 'admin'), updateEvaluationHandler);

// DELETE /api/evaluations/:id
router.delete('/:id', requireRole('admin'), deleteEvaluationHandler);

export default router;