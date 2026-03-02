import { body, query, param } from 'express-validator';
import validate from './validate';

// ─── GET /questions query-string validation ───────────────────────────
export const getQuestionsValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
    query('search').optional().trim().isString(),
    query('categoryId').optional().isNumeric().withMessage('Category ID must be numeric').toInt(),
    query('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be easy, medium, or hard'),
    query('type')
        .optional()
        .isIn(['mcq', 'coding', 'query', 'subjective'])
        .withMessage('Type must be mcq, coding, query, or subjective'),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean').toBoolean(),

    validate
];

// ─── GET /questions/:id param validation ──────────────────────────────
export const getQuestionByIdValidation = [
    param('id').isInt({ min: 1 }).withMessage('Question ID must be a positive integer').toInt(),
    validate
];

// ─── GET /questions/category/:categoryId param validation ─────────────
export const getQuestionsByCategoryValidation = [
    param('categoryId').isInt({ min: 1 }).withMessage('Category ID must be a positive integer').toInt(),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
    validate
];

// ─── POST /questions body validation ──────────────────────────────────
export const createQuestionValidation = [
    body('type')
        .notEmpty().withMessage('Question type is required')
        .isIn(['mcq', 'coding', 'query', 'subjective'])
        .withMessage('Type must be mcq, coding, query, or subjective'),

    body('question')
        .notEmpty().withMessage('Question text is required')
        .isString().withMessage('Question must be a string')
        .trim()
        .isLength({ min: 10 }).withMessage('Question must be at least 10 characters long'),

    body('marks')
        .notEmpty().withMessage('Marks are required')
        .isInt({ min: 0 }).withMessage('Marks must be a non-negative integer')
        .toInt(),

    body('difficulty')
        .notEmpty().withMessage('Difficulty is required')
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be easy, medium, or hard'),

    body('categoryId')
        .notEmpty().withMessage('Category ID is required')
        .isNumeric().withMessage('Category ID must be numeric')
        .toInt(),

    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array'),
    body('tags.*')
        .optional()
        .isString().withMessage('Each tag must be a string')
        .trim()
        .notEmpty().withMessage('Tags cannot be empty strings'),

    // MCQ-specific fields
    body('options')
        .optional()
        .isArray({ min: 2 }).withMessage('Options must have at least 2 items'),
    body('options.*.id')
        .optional()
        .isInt().withMessage('Option ID must be an integer'),
    body('options.*.text')
        .optional()
        .isString().withMessage('Option text must be a string')
        .trim()
        .notEmpty().withMessage('Option text cannot be empty'),
    body('options.*.isCorrect')
        .optional()
        .isBoolean().withMessage('Option isCorrect must be a boolean'),
    body('allowMultiple')
        .optional()
        .isBoolean().withMessage('allowMultiple must be a boolean'),
    body('negativeMarks')
        .optional()
        .isFloat({ min: 0 }).withMessage('Negative marks must be a non-negative number'),
    body('explanation')
        .optional()
        .isString().withMessage('Explanation must be a string')
        .trim(),

    // Coding-specific fields
    body('allowedLanguages')
        .optional()
        .isArray({ min: 1 }).withMessage('Allowed languages must be a non-empty array'),
    body('testCases')
        .optional()
        .isArray({ min: 1 }).withMessage('Test cases must be a non-empty array'),
    body('testCases.*.input')
        .optional()
        .isString().withMessage('Test case input must be a string'),
    body('testCases.*.expectedOutput')
        .optional()
        .isString().withMessage('Test case expected output must be a string'),
    body('constraints')
        .optional()
        .isString().withMessage('Constraints must be a string')
        .trim(),
    body('hints')
        .optional()
        .isArray().withMessage('Hints must be an array'),
    body('timeLimit')
        .optional()
        .isInt({ min: 1, max: 300 }).withMessage('Time limit must be 1-300 seconds')
        .toInt(),
    body('memoryLimit')
        .optional()
        .isInt({ min: 1, max: 512 }).withMessage('Memory limit must be 1-512 MB')
        .toInt(),

    // Query-specific fields
    body('databaseType')
        .optional()
        .isIn(['mysql', 'postgresql', 'mongodb', 'sqlite'])
        .withMessage('Database type must be mysql, postgresql, mongodb, or sqlite'),
    body('databaseSchema')
        .optional()
        .isString().withMessage('Database schema must be a string')
        .trim(),
    body('sampleData')
        .optional()
        .isString().withMessage('Sample data must be a string')
        .trim(),
    body('expectedQuery')
        .optional()
        .isString().withMessage('Expected query must be a string')
        .trim(),

    // Subjective-specific fields
    body('minLength')
        .optional()
        .isInt({ min: 1 }).withMessage('Min length must be at least 1')
        .toInt(),
    body('maxLength')
        .optional()
        .isInt({ min: 1 }).withMessage('Max length must be at least 1')
        .toInt(),
    body('expectedKeywords')
        .optional()
        .isArray().withMessage('Expected keywords must be an array'),
    body('evaluationRubric')
        .optional()
        .isArray().withMessage('Evaluation rubric must be an array'),

    validate
];

// ─── PUT /questions/:id body validation ───────────────────────────────
export const updateQuestionValidation = [
    param('id').isInt({ min: 1 }).withMessage('Question ID must be a positive integer').toInt(),

    // All fields optional for update (only validate if present)
    body('type')
        .optional()
        .isIn(['mcq', 'coding', 'query', 'subjective'])
        .withMessage('Type must be mcq, coding, query, or subjective'),

    body('question')
        .optional()
        .isString().withMessage('Question must be a string')
        .trim()
        .isLength({ min: 10 }).withMessage('Question must be at least 10 characters long'),

    body('marks')
        .optional()
        .isInt({ min: 0 }).withMessage('Marks must be a non-negative integer')
        .toInt(),

    body('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be easy, medium, or hard'),

    body('categoryId')
        .optional()
        .isNumeric().withMessage('Category ID must be numeric')
        .toInt(),

    body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array'),
    body('tags.*')
        .optional()
        .isString().withMessage('Each tag must be a string'),

    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean'),

    // MCQ fields (same as create, all optional)
    body('options')
        .optional()
        .isArray({ min: 2 }).withMessage('Options must have at least 2 items'),
    body('allowMultiple')
        .optional()
        .isBoolean().withMessage('allowMultiple must be a boolean'),
    body('negativeMarks')
        .optional()
        .isFloat({ min: 0 }).withMessage('Negative marks must be a non-negative number'),
    body('explanation')
        .optional()
        .isString().withMessage('Explanation must be a string'),

    // Coding fields
    body('allowedLanguages')
        .optional()
        .isArray({ min: 1 }).withMessage('Allowed languages must be a non-empty array'),
    body('testCases')
        .optional()
        .isArray({ min: 1 }).withMessage('Test cases must be a non-empty array'),
    body('timeLimit')
        .optional()
        .isInt({ min: 1, max: 300 }).withMessage('Time limit must be 1-300 seconds')
        .toInt(),
    body('memoryLimit')
        .optional()
        .isInt({ min: 1, max: 512 }).withMessage('Memory limit must be 1-512 MB')
        .toInt(),

    // Query fields
    body('databaseType')
        .optional()
        .isIn(['mysql', 'postgresql', 'mongodb', 'sqlite'])
        .withMessage('Database type must be mysql, postgresql, mongodb, or sqlite'),
    body('databaseSchema')
        .optional()
        .isString().withMessage('Database schema must be a string'),

    // Subjective fields
    body('minLength')
        .optional()
        .isInt({ min: 1 }).withMessage('Min length must be at least 1')
        .toInt(),
    body('maxLength')
        .optional()
        .isInt({ min: 1 }).withMessage('Max length must be at least 1')
        .toInt(),

    validate
];

// ─── DELETE /questions/:id param validation ───────────────────────────
export const deleteQuestionValidation = [
    param('id').isInt({ min: 1 }).withMessage('Question ID must be a positive integer').toInt(),
    validate
];
