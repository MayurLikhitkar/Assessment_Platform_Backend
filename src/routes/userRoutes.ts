import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { getAssessmentByIdForUser, getAssessmentQuestions, getAssessmentsForUser, getUserAssessment, getUserAssessments, startAssessment } from '../controllers/assessmentController';
import { asyncHandler } from '../utils/asyncHandler';
import { getAssessmentByIdValidation, getAssessmentsValidation, } from '../validations/assessmentValidations';
import validatePayload from '../middleware/validatePayload';
import { UserRole } from '../types/authTypes';

const router = express.Router();


router.get('/assessments', getAssessmentsValidation, asyncHandler(getAssessmentsForUser));


router.use(authenticate);
router.use(validatePayload);


router.get('/assessments/:id', getAssessmentByIdValidation, asyncHandler(getAssessmentByIdForUser));
router.post('/assessments/:id/start', authenticate, startAssessment);
// router.post('/assessments/:id/answer', authenticate, submitAnswer);
// router.post('/assessments/:id/complete', authenticate, completeAssessment);

router.get('/:userId/assessments', asyncHandler(getUserAssessments));
router.get('/:userId/assessment/:assessId', asyncHandler(getUserAssessment));
router.put('/:userId/assessment/:assessId', asyncHandler(getUserAssessment));

router.get('/assessments/:id/questions', getAssessmentByIdValidation, asyncHandler(getAssessmentQuestions));


export default router;