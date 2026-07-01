import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import {
    getQuestions,
    getQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    // exportQuestions,
} from '../controllers/questionController';
import { asyncHandler } from '../utils/asyncHandler';
import {
    getQuestionsValidation,
    getQuestionByIdValidation,
    createQuestionValidation,
    updateQuestionValidation,
    deleteQuestionValidation,
} from '../validations/questionValidations';
import { UserRole } from '../models/userModel';

const router = express.Router();

// ─── Public routes ────────────────────────────────────────────────────

router.get('/', getQuestionsValidation, asyncHandler(getQuestions));
router.get('/:id', getQuestionByIdValidation, asyncHandler(getQuestionById));

// ─── Protected routes (Admin / Super Admin) ───────────────────────────

// Export must be declared BEFORE /:id routes to avoid matching "export" as an :id
// router.get(
//     '/export',
//     authenticate,
//     authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
//     asyncHandler(exportQuestions)
// );

router.post(
    '/',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    createQuestionValidation,
    asyncHandler(createQuestion)
);

router.put(
    '/:id',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    updateQuestionValidation,
    asyncHandler(updateQuestion)
);

router.delete(
    '/:id',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    deleteQuestionValidation,
    asyncHandler(deleteQuestion)
);

// ─── Import (file upload) ─────────────────────────────────────────────
// NOTE: Requires a multer upload middleware to be configured.
//       Uncomment and add upload middleware when ready:
//
// import upload from '../middleware/upload';
// router.post(
//     '/import',
//     authenticate,
//     authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
//     upload.single('file'),
//     asyncHandler(importQuestions)
// );

export default router;