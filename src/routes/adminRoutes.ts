import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { createAssessment, deleteAssessment, getAssessmentById, getAssessments, getUserAssessments, updateAssessment } from '../controllers/assessmentController';
import { asyncHandler } from '../utils/asyncHandler';
import { createAssessmentValidation, getAssessmentByIdValidation, getAssessmentsValidation, updateAssessmentValidation } from '../validations/assessmentValidations';
import validatePayload from '../middleware/validatePayload';
import { UserRole } from '../types/authTypes';
import { getUsers, register } from '../controllers/authController';
import { createUserValidation } from '../validations/authValidation';
import { createQuestion, deleteQuestion, getQuestionById, getQuestions, updateQuestion } from '../controllers/questionController';
import { createQuestionValidation, deleteQuestionValidation, getQuestionByIdValidation, getQuestionsValidation, updateQuestionValidation } from '../validations/questionValidations';

const router = express.Router();

router.use(authenticate);
router.use(validatePayload);

/* --------- Assessments Routes --------- */
router.get('/assessments/', getAssessmentsValidation, asyncHandler(getAssessments));
router.get('/assessments/:id', getAssessmentByIdValidation, asyncHandler(getAssessmentById));
router.post(
    '/assessments',
    authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    createAssessmentValidation,
    asyncHandler(createAssessment)
);
router.put(
    '/assessments/:id',
    authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    updateAssessmentValidation,
    asyncHandler(updateAssessment)
);
router.delete(
    '/assessments/:id',
    authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    getAssessmentByIdValidation,
    asyncHandler(deleteAssessment)
);


/* --------- Users Routes --------- */
router.get('/users', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(getUsers));
router.post('/users', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), createUserValidation, asyncHandler(register));
router.get('/users/:userId/assessments', asyncHandler(getUserAssessments));


/* --------- Questions Routes --------- */
router.get('/questions', getQuestionsValidation, asyncHandler(getQuestions));
router.get('/questions/:id', getQuestionByIdValidation, asyncHandler(getQuestionById));
router.post(
    '/questions',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    createQuestionValidation,
    asyncHandler(createQuestion)
);
router.put(
    '/questions/:id',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    updateQuestionValidation,
    asyncHandler(updateQuestion)
);
router.delete(
    '/questions/:id',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    deleteQuestionValidation,
    asyncHandler(deleteQuestion)
);

export default router;