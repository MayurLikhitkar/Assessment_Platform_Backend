import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { createAssessment, getAssessmentById, getAssessments } from '../controllers/assessmentController';
import { asyncHandler } from '../utils/asyncHandler';
import { createAssessmentValidation, getAssessmentsValidation } from '../validations/assessmentValidations';
import { UserRole } from '../models/userModel';
import validatePayload from '../middleware/validatePayload';

const router = express.Router();

// Public routes
router.get('/', getAssessmentsValidation, asyncHandler(getAssessments));
router.get('/:id', asyncHandler(getAssessmentById));
// router.get('/:id/questions', getAssessmentQuestions);

// Protected routes — require authentication
router.use(authenticate);
router.use(validatePayload);

// Admin/Instructor routes
router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    createAssessmentValidation,
    asyncHandler(createAssessment)
);

// // User routes
// router.get('/user/:userId', authenticate, getUserAssessments);
// router.post('/:id/start', authenticate, startAssessment);
// router.post('/:id/answer', authenticate, submitAnswer);
// router.post('/:id/complete', authenticate, completeAssessment);

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