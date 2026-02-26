import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { getAssessmentById, getAssessments } from '../controllers/assessmentController';
import { asyncHandler } from '../utils/asyncHandler';
import { getAssessmentsValidation } from '../validations/assessmentValidations';

const router = express.Router();

// Validation rules
const assessmentValidation = [
    body('title').notEmpty().trim(),
    body('description').optional().trim(),
    body('categoryId').isNumeric(),
    body('type').isArray().notEmpty(),
    body('duration').isInt({ min: 1 }),
    body('totalMarks').isInt({ min: 1 }),
    body('passingMarks').isInt({ min: 0 }),
    body('questions').isArray(),
];

// Public routes
router.get('/', getAssessmentsValidation, asyncHandler(getAssessments));
router.get('/:id', asyncHandler(getAssessmentById));
// router.get('/:id/questions', getAssessmentQuestions);

// router.use(authenticate);

// // User routes
// router.get('/user/:userId', authenticate, getUserAssessments);
// router.post('/:id/start', authenticate, startAssessment);
// router.post('/:id/answer', authenticate, submitAnswer);
// router.post('/:id/complete', authenticate, completeAssessment);

// // Admin routes
// router.post(
//     '/',
//     authenticate,
//     authorize('admin', 'super_admin'),
//     assessmentValidation,
//     createAssessment
// );

// router.put(
//     '/:id',
//     authenticate,
//     authorize('admin', 'super_admin'),
//     assessmentValidation,
//     updateAssessment
// );

// router.delete(
//     '/:id',
//     authenticate,
//     authorize('admin', 'super_admin'),
//     deleteAssessment
// );

export default router;