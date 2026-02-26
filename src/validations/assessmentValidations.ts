import { query } from 'express-validator';
import validate from './validate';

export const getAssessmentsValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
    query('search').optional().trim().isString(),
    query('categoryId').optional().isNumeric().withMessage('Category ID must be numeric').toInt(),
    query('difficulty')
        .optional()
        .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
        .withMessage('Difficulty must be beginner, intermediate, advanced, or expert'),
    query('type')
        .optional()
        .custom((value) => {
            const types = Array.isArray(value) ? value : [value];
            const validTypes = ['aptitude', 'coding', 'query', 'subjective'];
            return types.every((t) => validTypes.includes(t));
        })
        .withMessage('Invalid assessment type provided'),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean').toBoolean(),
    query('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean').toBoolean(),
    query('sortBy').optional().isString().trim(),
    query('startDate').optional().isISO8601().withMessage('Invalid start date format').toDate(),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format').toDate(),

    validate
];