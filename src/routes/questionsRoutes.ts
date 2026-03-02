import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import {
    getQuestions,
    getQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestionsByCategory,
    exportQuestions,
} from '../controllers/questionController';
import { asyncHandler } from '../utils/asyncHandler';
import {
    getQuestionsValidation,
    getQuestionByIdValidation,
    getQuestionsByCategoryValidation,
    createQuestionValidation,
    updateQuestionValidation,
    deleteQuestionValidation,
} from '../validations/questionValidations';

const router = express.Router();

// ─── Public routes ────────────────────────────────────────────────────

router.get('/', getQuestionsValidation, asyncHandler(getQuestions));
router.get('/category/:categoryId', getQuestionsByCategoryValidation, asyncHandler(getQuestionsByCategory));
router.get('/:id', getQuestionByIdValidation, asyncHandler(getQuestionById));

// ─── Protected routes (Admin / Super Admin) ───────────────────────────

// Export must be declared BEFORE /:id routes to avoid matching "export" as an :id
router.get(
    '/export',
    authenticate,
    authorize('admin', 'super_admin'),
    asyncHandler(exportQuestions)
);

router.post(
    '/',
    authenticate,
    authorize('admin', 'super_admin'),
    createQuestionValidation,
    asyncHandler(createQuestion)
);

router.put(
    '/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    updateQuestionValidation,
    asyncHandler(updateQuestion)
);

router.delete(
    '/:id',
    authenticate,
    authorize('admin', 'super_admin'),
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
//     authorize('admin', 'super_admin'),
//     upload.single('file'),
//     asyncHandler(importQuestions)
// );

export default router;