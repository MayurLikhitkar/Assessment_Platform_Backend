import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { createAssessment, deleteAssessment, getAssessmentById, getAssessments, getUserAssessments, updateAssessment } from '../controllers/assessmentController';
import { asyncHandler } from '../utils/asyncHandler';
import { createAssessmentValidation, getAssessmentByIdValidation, getAssessmentsValidation, updateAssessmentValidation } from '../validations/assessmentValidations';
import { UserRole } from '../models/userModel';
import validatePayload from '../middleware/validatePayload';

const router = express.Router();

// Public routes — specific paths MUST come before /:id wildcard
router.get('/', getAssessmentsValidation, asyncHandler(getAssessments));

// Protected routes — require authentication
router.use(authenticate);
router.use(validatePayload);

// User routes — must be defined BEFORE /:id to avoid being caught by the wildcard
router.get('/user/:userId', asyncHandler(getUserAssessments));

// Wildcard ID routes (both public-like and admin)
router.get('/:id', getAssessmentByIdValidation, asyncHandler(getAssessmentById));

// Admin/Instructor routes
router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    createAssessmentValidation,
    asyncHandler(createAssessment)
);

// User routes
// router.get('/user/:userId', authenticate, getUserAssessments);
// router.post('/:id/start', authenticate, startAssessment);
// router.post('/:id/answer', authenticate, submitAnswer);
// router.post('/:id/complete', authenticate, completeAssessment);

router.put(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    updateAssessmentValidation,
    asyncHandler(updateAssessment)
);

router.delete(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    getAssessmentByIdValidation,
    asyncHandler(deleteAssessment)
);

export default router;