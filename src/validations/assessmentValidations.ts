import { body, oneOf, param, query } from 'express-validator';
import validate from './validate';
import { AssessmentDifficulty, AssessmentType } from '../models/assessmentModel';

export const getAssessmentsValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
    query('search').optional().trim().isString(),
    query('difficulty')
        .optional()
        .isIn(Object.values(AssessmentDifficulty))
        .withMessage('Difficulty must be one of: ' + Object.values(AssessmentDifficulty).join(', ')),
    query('type')
        .optional()
        .isIn(Object.values(AssessmentType))
        .withMessage('Type must be one of: ' + Object.values(AssessmentType).join(', ')),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean').toBoolean(),
    query('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean').toBoolean(),
    query('sortBy')
        .optional()
        .isIn(['createdAt', 'title', 'difficulty', 'durationInMinutes', 'startDate', 'endDate'])
        .withMessage('sortBy must be one of: createdAt, title, difficulty, durationInMinutes, startDate, endDate'),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('sortOrder must be asc or desc'),
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
        .withMessage('Type must be one of: ' + Object.values(AssessmentType).join(', ')),

    body('difficulty')
        .optional()
        .trim()
        .isIn(Object.values(AssessmentDifficulty))
        .withMessage('Difficulty must be one of: ' + Object.values(AssessmentDifficulty).join(', ')),

    body('durationInMinutes')
        .notEmpty().withMessage('Duration is required')
        .isInt({ min: 10, max: 240 }).withMessage('Duration must be between 10 and 240 minutes')
        .toInt(),

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

export const getAssessmentByIdValidation = [
    oneOf([
        param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
        param('id').isMongoId().withMessage('ID must be a valid MongoDB ObjectId'),
    ], { message: 'ID must be a valid MongoDB ObjectId or a positive integer' }),

    validate
];

export const updateAssessmentValidation = [
    // Param validation
    oneOf([
        param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
        param('id').isMongoId().withMessage('ID must be a valid MongoDB ObjectId'),
    ], { message: 'ID must be a valid MongoDB ObjectId or a positive integer' }),

    // All body fields optional for partial update
    body('title')
        .optional()
        .trim()
        .isString().withMessage('Title must be a string')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

    body('description')
        .optional()
        .trim()
        .isString().withMessage('Description must be a string')
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),

    body('type')
        .optional()
        .isArray({ min: 1 }).withMessage('Type must be a non-empty array')
        .custom((types: AssessmentType[]) => {
            const validTypes = new Set(Object.values(AssessmentType));
            return types.every((t) => validTypes.has(t));
        })
        .withMessage('Type must be one of: ' + Object.values(AssessmentType).join(', ')),

    body('difficulty')
        .optional()
        .trim()
        .isIn(Object.values(AssessmentDifficulty))
        .withMessage('Difficulty must be one of: ' + Object.values(AssessmentDifficulty).join(', ')),

    body('durationInMinutes')
        .optional()
        .isInt({ min: 10, max: 240 }).withMessage('Duration must be between 10 and 240 minutes')
        .toInt(),

    body('totalMarks').optional().isInt({ min: 0 }).withMessage('Total marks must be >= 0').toInt(),
    body('passingMarks').optional().isInt({ min: 0 }).withMessage('Passing marks must be >= 0').toInt(),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean').toBoolean(),
    body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean').toBoolean(),

    body('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date').toDate(),
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

    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('tags.*').optional().trim().isString().withMessage('Each tag must be a string').notEmpty().withMessage('Tags cannot be empty strings'),

    body('instructions')
        .optional()
        .trim()
        .isString().withMessage('Instructions must be a string')
        .isLength({ max: 5000 }).withMessage('Instructions cannot exceed 5000 characters'),

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
