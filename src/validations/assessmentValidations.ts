import { body, param, query } from 'express-validator';
import validate from './validate';
import { AssessmentDifficulty, AssessmentType } from '../types/assessmentTypes';

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
        .trim()
        .notEmpty().withMessage('Description is required')
        .isString().withMessage('Description must be a string')
        .isLength({ max: 10000 }).withMessage('Description cannot exceed 10000 characters'),

    body('type')
        .isArray({ min: 1 }).withMessage('Atleast 1 type is required')
        .custom((types: AssessmentType[]) => {
            const validTypes = new Set(Object.values(AssessmentType));
            return types.every((t) => validTypes.has(t));
        })
        .withMessage('Type must be one of: ' + Object.values(AssessmentType).join(', ')),

    body('difficulty')
        .trim()
        .isIn(Object.values(AssessmentDifficulty))
        .notEmpty().withMessage('Difficulty is required')
        .withMessage('Difficulty must be one of: ' + Object.values(AssessmentDifficulty).join(', ')),

    body('durationInMinutes')
        .notEmpty().withMessage('Duration is required')
        .isInt({ min: 5, max: 300 }).withMessage('Duration must be between 5 and 300 minutes')
        .toInt(),

    body('totalMarks').optional().isInt({ min: 0 }).withMessage('Total marks must be greater than or equal to 0').toInt(),
    body('passingMarks').optional()
        .isInt({ min: 0 }).withMessage('Passing marks must be greater than or equal to 0')
        .custom((value: number, { req }) => {
            if (req.body.totalMarks !== undefined && value > Number(req.body.totalMarks)) {
                throw new Error('Passing marks cannot exceed total marks');
            }
            return true;
        }).toInt(),
    body('questions').optional().isArray().withMessage('Questions must be an array')
        .custom((questions: string[]) => {
            const unique = new Set(questions.map(t => t.toString()));
            if (unique.size !== questions.length) throw new Error('Duplicate questions not allowed');
            return true;
        }),
    body('questions.*').optional().trim().isMongoId().withMessage('Each question must be a valid MongoDB ObjectId'),

    body('startDate')
        .optional()
        .isISO8601().withMessage('Start date must be a valid ISO 8601 date')
        .custom((value) => {
            const now = new Date();
            now.setSeconds(0, 0);

            if (new Date(value) < now) {
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
        .notEmpty().withMessage('Tags are required')
        .isArray({ min: 1 }).withMessage('At least one tag is required')
        .custom((tags: string[]) => {
            const unique = new Set(tags.map(t => t.toLowerCase()));
            if (unique.size !== tags.length) throw new Error('Duplicate tags not allowed');
            return true;
        }),
    body('tags.*')
        .isString().withMessage('Each tag must be a string')
        .trim()
        .notEmpty().withMessage('Tags cannot be empty strings'),

    body('instructions')
        .optional({ values: 'falsy' })
        .trim()
        .isString().withMessage('Instructions must be a string')
        .isLength({ max: 5000 }).withMessage('Instructions cannot exceed 5000 characters'),

    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean').toBoolean(),
    body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean').toBoolean(),
    body('negativeMarking').optional().isBoolean().withMessage('Negative Marking must be a boolean').toBoolean(),

    // Proctoring settings
    body('webcam')
        .optional()
        .custom((val) => typeof val === 'object' && val !== null && !Array.isArray(val))
        .withMessage('Webcam fields must be an object'),
    body('webcam.allowed').optional()
        .isBoolean().withMessage('allowed must be a boolean').toBoolean(),
    body('webcam.url').optional()
        .isString().withMessage('URL must be a string'),
    body('microphone')
        .optional()
        .custom((val) => typeof val === 'object' && val !== null && !Array.isArray(val))
        .withMessage('Microphone fields must be an object'),
    body('microphone.allowed').optional()
        .isBoolean().withMessage('allowed must be a boolean').toBoolean(),
    body('microphone.url').optional()
        .isString().withMessage('URL must be a string'),
    body('tabSwitch')
        .optional()
        .custom((val) => typeof val === 'object' && val !== null && !Array.isArray(val))
        .withMessage('TabSwitch fields must be an object'),
    body('tabSwitch.allowed').optional()
        .isBoolean().withMessage('allowed must be a boolean').toBoolean(),
    body('tabSwitch.max').optional()
        .isInt({ min: 0 }).withMessage('Maximum tab switches must be a non-negative integer').toInt(),
    body('fullscreenExit')
        .optional()
        .custom((val) => typeof val === 'object' && val !== null && !Array.isArray(val))
        .withMessage('FullscreenExit fields must be an object'),
    body('fullscreenExit.allowed').optional()
        .isBoolean().withMessage('allowed must be a boolean').toBoolean(),
    body('fullscreenExit.max').optional()
        .isInt({ min: 0 }).withMessage('Maximum fullscreen exits must be a non-negative integer').toInt(),
    body('enableRecording').optional().isBoolean().withMessage('enableRecording must be a boolean').toBoolean(),

    validate
];

export const getAssessmentByIdValidation = [
    param('id').isMongoId().withMessage('ID must be a valid MongoDB ObjectId'),

    validate
];

export const updateAssessmentValidation = [
    // Param validation
    param('id').isMongoId().withMessage('ID must be a valid MongoDB ObjectId'),

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
        .isLength({ max: 10000 }).withMessage('Description cannot exceed 10000 characters'),

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
        .isInt({ min: 5, max: 300 }).withMessage('Duration must be between 5 and 300 minutes')
        .toInt(),

    body('totalMarks').optional().isInt({ min: 0 }).withMessage('Total marks must be greater than or equal to 0').toInt(),
    body('passingMarks')
        .optional()
        .isInt({ min: 0 }).withMessage('Passing marks must be greater than or equal to 0')
        .custom((value: number, { req }) => {
            if (req.body.totalMarks !== undefined && value > Number(req.body.totalMarks)) {
                throw new Error('Passing marks cannot exceed total marks');
            }
            return true;
        }).toInt(),
    body('questions').optional().isArray().withMessage('Questions must be an array')
        .custom((questions: string[]) => {
            const unique = new Set(questions.map(t => t.toString()));
            if (unique.size !== questions.length) throw new Error('Duplicate questions not allowed');
            return true;
        }),
    body('questions.*').optional().trim().isMongoId().withMessage('Each question must be a valid MongoDB ObjectId'),

    body('startDate')
        .optional()
        .isISO8601().withMessage('Start date must be a valid ISO 8601 date')
        .custom((value) => {
            const now = new Date();
            now.setSeconds(0, 0);

            if (new Date(value) < now) {
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
        .isArray({ min: 1 }).withMessage('At least one tag is required')
        .custom((tags: string[]) => {
            const unique = new Set(tags.map(t => t.toLowerCase()));
            if (unique.size !== tags.length) throw new Error('Duplicate tags not allowed');
            return true;
        }),
    body('tags.*')
        .isString().withMessage('Each tag must be a string')
        .trim()
        .notEmpty().withMessage('Tags cannot be empty strings'),

    body('instructions')
        .optional({ values: 'falsy' })
        .trim()
        .isString().withMessage('Instructions must be a string')
        .isLength({ max: 5000 }).withMessage('Instructions cannot exceed 5000 characters'),

    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean').toBoolean(),
    body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean').toBoolean(),
    body('negativeMarking').optional().isBoolean().withMessage('Negative Marking must be a boolean').toBoolean(),

    // Proctoring settings
    body('webcam')
        .optional()
        .custom((val) => typeof val === 'object' && val !== null && !Array.isArray(val))
        .withMessage('Webcam fields must be an object'),
    body('webcam.allowed').optional()
        .isBoolean().withMessage('allowed must be a boolean').toBoolean(),
    body('webcam.url').optional()
        .isString().withMessage('URL must be a string'),
    body('microphone')
        .optional()
        .custom((val) => typeof val === 'object' && val !== null && !Array.isArray(val))
        .withMessage('Microphone fields must be an object'),
    body('microphone.allowed').optional()
        .isBoolean().withMessage('allowed must be a boolean').toBoolean(),
    body('microphone.url').optional()
        .isString().withMessage('URL must be a string'),
    body('tabSwitch')
        .optional()
        .custom((val) => typeof val === 'object' && val !== null && !Array.isArray(val))
        .withMessage('TabSwitch fields must be an object'),
    body('tabSwitch.allowed').optional()
        .isBoolean().withMessage('allowed must be a boolean').toBoolean(),
    body('tabSwitch.max').optional()
        .isInt({ min: 0 }).withMessage('Maximum tab switches must be a non-negative integer').toInt(),
    body('fullscreenExit')
        .optional()
        .custom((val) => typeof val === 'object' && val !== null && !Array.isArray(val))
        .withMessage('FullscreenExit fields must be an object'),
    body('fullscreenExit.allowed').optional()
        .isBoolean().withMessage('allowed must be a boolean').toBoolean(),
    body('fullscreenExit.max').optional()
        .isInt({ min: 0 }).withMessage('Maximum fullscreen exits must be a non-negative integer').toInt(),
    body('enableRecording').optional().isBoolean().withMessage('enableRecording must be a boolean').toBoolean(),

    validate
];
