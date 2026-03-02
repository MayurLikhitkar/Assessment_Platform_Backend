import { body, query } from 'express-validator';
import validate from './validate';

export const getAssessmentsValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
    query('search').optional().trim().isString(),
    query('difficulty')
        .optional()
        .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
        .withMessage('Difficulty must be beginner, intermediate, advanced, or expert'),
    query('type')
        .optional()
        .custom((value) => {
            const types = Array.isArray(value) ? value : [value];
            const validTypes = new Set(['aptitude', 'coding', 'query', 'subjective']);
            return types.every((t: string) => validTypes.has(t));
        })
        .withMessage('Invalid assessment type provided'),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean').toBoolean(),
    query('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean').toBoolean(),
    query('sortBy').optional().isString().trim(),
    query('startDate').optional().isISO8601().withMessage('Invalid start date format').toDate(),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format').toDate(),

    validate
];

export const createAssessmentValidation = [
    body('title')
        .notEmpty().withMessage('Title is required')
        .isString().withMessage('Title must be a string')
        .trim()
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

    body('description')
        .optional()
        .isString().withMessage('Description must be a string')
        .trim()
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),

    body('type')
        .isArray({ min: 1 }).withMessage('Type must be a non-empty array')
        .custom((types: string[]) => {
            const validTypes = new Set(['aptitude', 'coding', 'query', 'subjective']);
            return types.every((t) => validTypes.has(t));
        })
        .withMessage('Each type must be one of: aptitude, coding, query, subjective'),

    body('difficulty')
        .optional()
        .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
        .withMessage('Difficulty must be one of: beginner, intermediate, advanced, expert'),

    body('duration')
        .notEmpty().withMessage('Duration is required')
        .isInt({ min: 1 }).withMessage('Duration must be at least 1 minute')
        .toInt(),

    body('passingMarks')
        .notEmpty().withMessage('Passing marks is required')
        .isInt({ min: 0 }).withMessage('Passing marks must be a non-negative integer')
        .toInt(),

    body('questions')
        .isArray({ min: 1 }).withMessage('Questions must be a non-empty array of question IDs'),

    body('questions.*')
        .isInt({ min: 1 }).withMessage('Each question ID must be a positive integer')
        .toInt(),

    body('startDate')
        .optional()
        .isISO8601().withMessage('Start date must be a valid ISO 8601 date'),

    body('endDate')
        .optional()
        .isISO8601().withMessage('End date must be a valid ISO 8601 date'),

    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array'),

    body('tags.*')
        .optional()
        .isString().withMessage('Each tag must be a string')
        .trim()
        .notEmpty().withMessage('Tags cannot be empty strings'),

    body('instructions')
        .optional()
        .isString().withMessage('Instructions must be a string')
        .trim(),

    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean'),

    body('isPublic')
        .optional()
        .isBoolean().withMessage('isPublic must be a boolean'),

    // Proctoring settings
    body('requireWebcam').optional().isBoolean().withMessage('requireWebcam must be a boolean'),
    body('requireMicrophone').optional().isBoolean().withMessage('requireMicrophone must be a boolean'),
    body('allowTabSwitch').optional().isBoolean().withMessage('allowTabSwitch must be a boolean'),
    body('maxTabSwitches').optional().isInt({ min: 0 }).withMessage('maxTabSwitches must be a non-negative integer'),
    body('allowFullscreenExit').optional().isBoolean().withMessage('allowFullscreenExit must be a boolean'),
    body('maxFullscreenExits').optional().isInt({ min: 0 }).withMessage('maxFullscreenExits must be a non-negative integer'),
    body('enableRecording').optional().isBoolean().withMessage('enableRecording must be a boolean'),

    validate
];