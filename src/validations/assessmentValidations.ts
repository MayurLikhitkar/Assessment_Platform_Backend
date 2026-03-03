import { body, query } from 'express-validator';
import validate from './validate';
import { AssessmentDifficulty, AssessmentType } from '../models/assessmentModel';

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
        .trim()
        .notEmpty().withMessage('Title is required')
        .isString().withMessage('Title must be a string')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

    body('description')
        .optional({ values: 'falsy' })
        .trim()
        .isString().withMessage('Description must be a string')
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),

    body('type')
        .isArray({ min: 1 }).withMessage('Type must be a non-empty array')
        .custom((types: AssessmentType[]) => {
            const validTypes = new Set(Object.values(AssessmentType));
            return types.every((t) => validTypes.has(t));
        })
        .withMessage('Each type must be one of: ' + Object.values(AssessmentType).join(', ')),

    body('difficulty')
        .optional({ values: 'falsy' })
        .trim()
        .isIn(Object.values(AssessmentDifficulty))
        .withMessage('Difficulty must be one of: ' + Object.values(AssessmentDifficulty).join(', ')),

    body('durationInMinutes')
        .notEmpty().withMessage('Duration is required')
        .isInt({ min: 10, max: 240 }).withMessage('Duration must be between 10 and 240 minutes')
        .toInt(),

    body('passingMarks')
        .notEmpty().withMessage('Passing marks is required')
        .isInt({ min: 0 }).withMessage('Passing marks must be a non-negative integer')
        .toInt(),

    body('questions')
        .isArray({ min: 1 }).withMessage('Questions must be a non-empty array of question IDs'),

    body('questions.*')
        .isMongoId().withMessage('Each question ID must be a valid MongoDB ObjectId'),

    body('startDate')
        .optional()
        .isISO8601().withMessage('Start date must be a valid ISO 8601 date')
        .custom((value) => {
            if (new Date(value) < new Date()) {
                throw new Error('Start date cannot be in the past');
            }
            return true;
        })
        .toDate(),

    body('endDate')
        .optional()
        .isISO8601().withMessage('End date must be a valid ISO 8601 date')
        .custom((value, { req }) => {
            if (req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
                throw new Error('End date must be after start date');
            }
            return true;
        })
        .toDate(),

    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array'),

    body('tags.*')
        .optional()
        .trim()
        .isString().withMessage('Each tag must be a string')
        .notEmpty().withMessage('Tags cannot be empty strings'),

    body('instructions')
        .optional()
        .trim()
        .isString().withMessage('Instructions must be a string')
        .isLength({ max: 5000 }).withMessage('Instructions cannot exceed 5000 characters'),

    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean').toBoolean(),

    body('isPublic')
        .optional()
        .isBoolean().withMessage('isPublic must be a boolean').toBoolean(),

    // Proctoring settings
    body('requireWebcam').optional().isBoolean().withMessage('requireWebcam must be a boolean').toBoolean(),
    body('requireMicrophone').optional().isBoolean().withMessage('requireMicrophone must be a boolean').toBoolean(),
    body('allowTabSwitch').optional().isBoolean().withMessage('allowTabSwitch must be a boolean').toBoolean(),
    body('maxTabSwitches').optional().isInt({ min: 0, max: 10 }).withMessage('maxTabSwitches must be between 0 and 10').toInt(),
    body('allowFullscreenExit').optional().isBoolean().withMessage('allowFullscreenExit must be a boolean').toBoolean(),
    body('maxFullscreenExits').optional().isInt({ min: 0, max: 10 }).withMessage('maxFullscreenExits must be between 0 and 10').toInt(),
    body('enableRecording').optional().isBoolean().withMessage('enableRecording must be a boolean').toBoolean(),

    validate
];