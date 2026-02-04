import express from 'express';
import { body } from 'express-validator';
import {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryQuestions,
    getCategoryTree,
} from '../controllers/categories';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Validation rules
const categoryValidation = [
    body('name').notEmpty().trim().escape(),
    body('description').optional().trim(),
    body('type').isArray().notEmpty(),
    body('subCategories').optional().isArray(),
    body('colorCode').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
];

// Public routes
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/:id/questions', getCategoryQuestions);

// Protected routes (admin only)
router.post(
    '/',
    authenticate,
    authorize('admin', 'super_admin'),
    categoryValidation,
    createCategory
);

router.put(
    '/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    categoryValidation,
    updateCategory
);

router.delete(
    '/:id',
    authenticate,
    authorize('admin', 'super_admin'),
    deleteCategory
);

router.get('/:id', getCategoryById);

export default router;