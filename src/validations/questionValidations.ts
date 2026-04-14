import { body, query, param } from 'express-validator';
import validate from './validate';
import { DatabaseType, Difficulty, IOption, ProgrammingLanguage, QuestionType } from '../models/questionModel';

// ─── GET /questions query-string validation ───────────────────────────
export const getQuestionsValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
    query('search').optional().trim().isString(),
    query('categoryId').optional().isMongoId().withMessage('Category ID must be a valid MongoDB ObjectId'),
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

// ─── POST /questions body validation ──────────────────────────────────
export const createQuestionValidation = [
    body('type')
        .notEmpty().withMessage('Question type is required')
        .isIn(Object.values(QuestionType))
        .withMessage('Type must be one of: ' + Object.values(QuestionType).join(', ')),

    body('question')
        .notEmpty().withMessage('Question text is required')
        .isString().withMessage('Question must be a string')
        .trim()
        .isLength({ min: 10 }).withMessage('Question must be at least 10 characters long')
        .isLength({ max: 2000 }).withMessage('Question must not exceed 2000 characters'),

    body('questionExplanation')
        .notEmpty().withMessage('Question explanation is required')
        .isString().withMessage('Question explanation must be a string')
        .trim()
        .isLength({ min: 10 }).withMessage('Question explanation must be at least 10 characters long')
        .isLength({ max: 3000 }).withMessage('Question explanation must not exceed 3000 characters'),

    body('marks')
        .notEmpty().withMessage('Marks are required')
        .isInt({ min: 1, max: 100 }).withMessage('Marks must be between 1 and 100')
        .toInt(),

    body('negativeMarks')
        .optional()
        .isFloat({ min: 0 }).withMessage('Negative marks must be a non-negative number')
        .custom((val, { req }) => {
            if (val > req.body.marks) throw new Error('Negative marks cannot exceed total marks');
            return true;
        })
        .toFloat(),

    body('difficulty')
        .notEmpty().withMessage('Difficulty is required')
        .isIn(Object.values(Difficulty))
        .withMessage('Difficulty must be one of: ' + Object.values(Difficulty).join(', ')),

    body('tags')
        .notEmpty().withMessage('Tags are required')
        .isArray({ min: 1 }).withMessage('At least one tag is required'),
    body('tags.*')
        .optional()
        .isString().withMessage('Each tag must be a string')
        .trim()
        .notEmpty().withMessage('Tags cannot be empty strings'),

    // MCQ-specific fields
    body('options')
        .if(body('type').equals(QuestionType.MCQ))
        .isArray({ min: 2, max: 10 }).withMessage('There must be between 2 and 10 options')
        .custom((options: IOption[]) => {
            if (!options) return true;
            const correctCount = options.filter(opt => opt?.isCorrect).length;
            if (correctCount < 1) {
                throw new Error('MCQ must have at least one correct answer');
            }
            if (correctCount === options.length) {
                throw new Error('MCQ must have at least one incorrect answer');
            }
            const texts = new Set(options.map(o => o.text?.trim().toLowerCase()));
            if (texts.size !== options.length) {
                throw new Error('All options must have unique text');
            }
            return true;
        }),
    body('options.*.text')
        .if(body('type').equals(QuestionType.MCQ))
        .isString().withMessage('Option text must be a string')
        .trim()
        .isLength({ min: 1, max: 500 }).withMessage('Option text must be between 1 and 500 characters'),
    body('options.*.isCorrect')
        .optional()
        .isBoolean().withMessage('Option isCorrect must be a boolean')
        .toBoolean(),
    body('answerExplanation')
        .optional()
        .isString().withMessage('Answer explanation must be a string')
        .isLength({ max: 2000 }).withMessage('Answer explanation must not exceed 2000 characters')
        .trim(),

    // Coding-specific fields
    body('allowedLanguages')
        .if(body('type').equals(QuestionType.CODING))
        .isArray({ min: 1 }).withMessage('At least one programming language must be selected')
        .custom((types: ProgrammingLanguage[]) => {
            const validTypes = new Set(Object.values(ProgrammingLanguage));
            return types.every((t) => validTypes.has(t));
        })
        .withMessage('Type must be one of: ' + Object.values(ProgrammingLanguage).join(', ')),
    body('testCases')
        .if(body('type').equals(QuestionType.CODING))
        .isArray({ min: 1 }).withMessage('Test cases must be a non-empty array'),
    body('testCases.*.input')
        .if(body('type').equals(QuestionType.CODING))
        .notEmpty().withMessage('Test case input is required')
        .isString().withMessage('Test case input must be a string'),
    body('testCases.*.expectedOutput')
        .if(body('type').equals(QuestionType.CODING))
        .notEmpty().withMessage('Test case expected output is required')
        .isString().withMessage('Test case expected output must be a string'),
    body('testCases.*.isPublic')
        .optional()
        .isBoolean().withMessage('isPublic must be a boolean')
        .toBoolean(),
    body('constraints')
        .optional()
        .isString().withMessage('Constraints must be a string')
        .isLength({ max: 500 }).withMessage('Constraints must not exceed 500 characters')
        .trim(),
    body('hints')
        .optional()
        .isArray().withMessage('Hints must be an array'),
    body('hints.*')
        .optional()
        .isString().withMessage('Each hint must be a string')
        .trim()
        .notEmpty().withMessage('Hints cannot be empty strings'),
    body('timeLimitInMinutes')
        .optional()
        .isInt({ min: 1, max: 180 }).withMessage('Time limit must be 1-180 minutes')
        .toInt(),
    body('memoryLimitInMB')
        .optional()
        .isInt({ min: 1, max: 1024 }).withMessage('Memory limit must be 1-1024 MB')
        .toInt(),

    // Query-specific fields
    body('databaseType')
        .if(body('type').equals(QuestionType.QUERY))
        .isIn(Object.values(DatabaseType))
        .withMessage('Database type must be one of: ' + Object.values(DatabaseType).join(', ')),
    body('databaseSchema')
        .if(body('type').equals(QuestionType.QUERY))
        .notEmpty().withMessage('Database schema is required for query questions')
        .isString().withMessage('Database schema must be a string')
        .isLength({ min: 10 }).withMessage('Schema must be at least 10 characters long')
        .trim(),
    body('sampleData')
        .optional()
        .isString().withMessage('Sample data must be a string')
        .trim(),
    body('expectedQuery')
        .optional()
        .isString().withMessage('Expected query must be a string')
        .isLength({ min: 5, max: 500 }).withMessage('Expected query must be at least 5 characters long and not exceed 500 characters')
        .trim(),

    // Subjective-specific fields
    body('minLength')
        .if(body('type').equals(QuestionType.SUBJECTIVE))
        .notEmpty().withMessage('Min length is required for subjective questions')
        .isInt({ min: 10 }).withMessage('Min length must be at least 10')
        .toInt(),
    body('maxLength')
        .if(body('type').equals(QuestionType.SUBJECTIVE))
        .notEmpty().withMessage('Max length is required for subjective questions')
        .custom((val, { req }) => {
            if (parseInt(val) < parseInt(req.body.minLength)) throw new Error('Max length must be >= min length');
            return true;
        })
        .toInt(),
    body('expectedKeywords')
        .if(body('type').equals(QuestionType.SUBJECTIVE))
        .isArray().withMessage('Expected keywords must be an array'),
    body('expectedKeywords.*')
        .if(body('type').equals(QuestionType.SUBJECTIVE))
        .isString().withMessage('Each tag must be a string')
        .trim()
        .notEmpty().withMessage('Tags cannot be empty strings'),
    body('evaluationRubric')
        .if(body('type').equals(QuestionType.SUBJECTIVE))
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

    body('questionExplanation')
        .optional()
        .isString().withMessage('Question explanation must be a string')
        .trim()
        .isLength({ min: 10 }).withMessage('Question explanation must be at least 10 characters long'),

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
        .isMongoId().withMessage('Category ID must be a valid MongoDB ObjectId'),

    body('tags')
        .optional()
        .isArray({ min: 1 }).withMessage('Tags must be a non-empty array'),
    body('tags.*')
        .optional()
        .isString().withMessage('Each tag must be a string'),

    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean'),

    // MCQ fields (same as create)
    body('options')
        .optional()
        .isArray({ min: 2, max: 10 }).withMessage('Options must be between 2 and 10 items')
        .custom((options: IOption[]) => {
            const correctCount = options.filter(opt => opt && opt.isCorrect).length;
            if (correctCount < 1) {
                throw new Error('MCQ must have at least one correct answer');
            }
            if (correctCount === options.length) {
                throw new Error('MCQ must have at least one incorrect answer');
            }
            const texts = new Set(options.map(o => o.text?.trim().toLowerCase()));
            if (texts.size !== options.length) {
                throw new Error('All options must have unique text');
            }
            return true;
        }),
    body('options.*.text')
        .optional()
        .isString().withMessage('Option text must be a string')
        .trim()
        .isLength({ min: 1, max: 500 }).withMessage('Option text must be between 1 and 500 characters'),
    body('allowMultiple')
        .optional()
        .isBoolean().withMessage('allowMultiple must be a boolean'),
    body('negativeMarks')
        .optional()
        .isFloat({ min: 0 }).withMessage('Negative marks must be a non-negative number')
        .custom((val, { req }) => {
            if (req.body.marks !== undefined && val > req.body.marks) throw new Error('Negative marks cannot exceed total marks');
            return true;
        }),
    body('answerExplanation')
        .optional()
        .isString().withMessage('Answer explanation must be a string'),

    // Coding fields
    body('allowedLanguages')
        .optional()
        .isArray({ min: 1 }).withMessage('Allowed languages must be a non-empty array'),
    body('testCases')
        .optional()
        .isArray({ min: 1 }).withMessage('Test cases must be a non-empty array'),
    body('timeLimitInMinutes')
        .optional()
        .isInt({ min: 1, max: 180 }).withMessage('Time limit must be 1-180 minutes')
        .toInt(),
    body('memoryLimitInMB')
        .optional()
        .isInt({ min: 1, max: 1024 }).withMessage('Memory limit must be 1-1024 MB')
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
        .isInt({ min: 10 }).withMessage('Min length must be at least 10')
        .toInt(),
    body('maxLength')
        .optional()
        .isInt({ min: 10 }).withMessage('Max length must be at least 10')
        .custom((val, { req }) => {
            if (req.body.minLength !== undefined && parseInt(val) < parseInt(req.body.minLength)) throw new Error('Max length must be >= min length');
            return true;
        })
        .toInt(),

    validate
];

// ─── DELETE /questions/:id param validation ───────────────────────────
export const deleteQuestionValidation = [
    param('id').isInt({ min: 1 }).withMessage('Question ID must be a positive integer').toInt(),
    validate
];
