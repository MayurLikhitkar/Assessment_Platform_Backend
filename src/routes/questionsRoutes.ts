import express from 'express';
import { body } from 'express-validator';
import {
    getQuestions,
    getQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestionsByCategory,
    importQuestions,
    exportQuestions,
} from '../controllers/questions';
import { authenticate, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

// Validation rules
const questionValidation = [
    body('type').isIn(['mcq', 'coding', 'query', 'subjective']),
    body('question').notEmpty().trim(),
    body('marks').isInt({ min: 1 }),
    body('difficulty').isIn(['easy', 'medium', 'hard']),
    body('categoryId').isInt(),
    body('tags').optional().isArray(),
];

// Public routes
router.get('/', getQuestions);
router.get('/category/:categoryId', getQuestionsByCategory);
router.get('/:id', getQuestionById);

// Protected routes (admin only)
router.post(
    '/',
    authenticate,
    authorize('admin', 'super_admin'),
    questionValidation,
    createQuestion
);

router.put(
    '/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    questionValidation,
    updateQuestion
);

router.delete(
    '/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    deleteQuestion
);

// Import/Export
router.post(
    '/import',
    authenticate,
    authorize('admin', 'super_admin'),
    upload.single('file'),
    importQuestions
);

router.get(
    '/export',
    authenticate,
    authorize('admin', 'super_admin'),
    exportQuestions
);

export default router;